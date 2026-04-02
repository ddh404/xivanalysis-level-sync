import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {Fragment, useState} from 'react'
import {Checkbox, Table} from 'semantic-ui-react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import styles from './SongsWindows.module.css'

const SONG_KEYS = ['THE_WANDERERS_MINUET', 'MAGES_BALLAD', 'ARMYS_PAEON'] as const
type SongKey = typeof SONG_KEYS[number]

const SONG_MAX_DURATION = 48000
const BAR_WIDTH_PX = 300

const SONG_COLORS: Record<SongKey, string> = {
	THE_WANDERERS_MINUET: '#add549',
	MAGES_BALLAD: '#b09fef',
	ARMYS_PAEON: '#eb9b5f',
}

interface SongSegment {
	songKey: SongKey
	start: number
	end?: number
}

interface SongsWindow {
	start: number
	end?: number
	segments: SongSegment[]
}

interface SongsWindowsOutputProps {
	windows: SongsWindow[]
	maxWindowDuration: number
	pullTimestamp: number
	actionNames: Record<SongKey, string>
}

function SongsWindowsOutput({windows, maxWindowDuration, pullTimestamp, actionNames}: SongsWindowsOutputProps) {
	const [showDecimal, setShowDecimal] = useState(false)

	const formatDuration = (ms: number): string =>
		showDecimal
			? `${(ms / 1000).toFixed(1)}s`
			: `${Math.round(ms / 1000)}s`

	const formatTimestamp = (epochMs: number): string => {
		const elapsedMs = epochMs - pullTimestamp
		const totalSeconds = Math.floor(elapsedMs / 1000)
		const minutes = Math.floor(totalSeconds / 60)
		const seconds = totalSeconds % 60
		if (showDecimal) {
			const tenths = Math.floor((elapsedMs % 1000) / 100)
			return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`
		}
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
	}

	return <Fragment>
		<Checkbox
			toggle
			label={<label><Trans id="brd.songs-windows.show-decimal">Show decimals</Trans></label>}
			checked={showDecimal}
			onChange={(_, data) => setShowDecimal(!!data.checked)}
			className={styles.checkbox}
		/>
		<div className={styles.legend}>
			{SONG_KEYS.map(key => (
				<span key={key} className={styles.legendItem}>
					<span
						className={styles.legendColor}
						style={{backgroundColor: SONG_COLORS[key]}}
					/>
					<DataLink action={key}/>
				</span>
			))}
		</div>
		<Table collapsing unstackable compact="very">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell>#</Table.HeaderCell>
					<Table.HeaderCell>
						<Trans id="brd.songs-windows.col.start">Start</Trans>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<Trans id="brd.songs-windows.col.duration">Duration</Trans>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<Trans id="brd.songs-windows.col.sequence">Song Sequence</Trans>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{windows.map((window, i) => {
					const windowEnd = window.end ?? 0
					const windowDuration = windowEnd - window.start

					const toPx = (ms: number) => Math.round(ms / maxWindowDuration * BAR_WIDTH_PX)

					const barItems: Array<{widthPx: number, color?: string, title: string}> = []

					for (let j = 0; j < window.segments.length; j++) {
						const seg = window.segments[j]
						const segEnd = seg.end ?? Math.min(windowEnd, seg.start + SONG_MAX_DURATION)
						const segDuration = Math.max(0, segEnd - seg.start)

						const leftPx = toPx(seg.start - window.start)
						const rightPx = toPx(segEnd - window.start)

						// Gap between the end of the previous segment and the start of this one
						if (j > 0) {
							const prevSeg = window.segments[j - 1]
							const prevEnd = prevSeg.end
								?? Math.min(seg.start, prevSeg.start + SONG_MAX_DURATION)
							const prevRightPx = toPx(prevEnd - window.start)
							const gapWidthPx = leftPx - prevRightPx
							if (gapWidthPx > 0) {
								barItems.push({
									widthPx: gapWidthPx,
									title: `Gap: ${formatDuration(seg.start - prevEnd)}`,
								})
							}
						}

						barItems.push({
							widthPx: rightPx - leftPx,
							color: SONG_COLORS[seg.songKey],
							title: `${actionNames[seg.songKey]}: ${formatDuration(segDuration)}`,
						})
					}

					return <Table.Row key={window.start}>
						<Table.Cell>{i + 1}</Table.Cell>
						<Table.Cell>{formatTimestamp(window.start)}</Table.Cell>
						<Table.Cell>{formatDuration(windowDuration)}</Table.Cell>
						<Table.Cell>
							<div className={styles.songBar}>
								{barItems.map((item, k) => (
									<div
										key={k}
										className={item.color != null ? styles.songSegment : styles.gapSegment}
										style={{
											width: `${item.widthPx}px`,
											backgroundColor: item.color,
										}}
										title={item.title}
									/>
								))}
							</div>
						</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>
	</Fragment>
}

export class SongsWindows extends Analyser {
	static override handle = 'songs-windows'
	static override title = msg({id: 'brd.songs-windows.title', message: 'Song Windows'})
	static override displayOrder = DISPLAY_ORDER.SONGS_WINDOWS

	@dependency private data!: Data

	private windows: SongsWindow[] = []
	private currentWindow: SongsWindow | undefined
	private currentSegment: SongSegment | undefined

	private readonly songActionIds = SONG_KEYS.map(key => this.data.actions[key].id)
	private readonly songStatusIds = SONG_KEYS.map(key => this.data.statuses[key].id)


	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter.type('action').action(oneOf(this.songActionIds)),
			this.onSongCast,
		)

		this.addEventHook(
			playerFilter.type('statusRemove').status(oneOf(this.songStatusIds)).target(this.parser.actor.id),
			this.onSongStatusRemove,
		)

		this.addEventHook('complete', this.onComplete)
	}

	private getSongKeyForActionId(actionId: number): SongKey | undefined {
		return SONG_KEYS.find(key => this.data.actions[key].id === actionId)
	}

	private getSongKeyForStatusId(statusId: number): SongKey | undefined {
		return SONG_KEYS.find(key => this.data.statuses[key].id === statusId)
	}

	private onSongCast(event: Events['action']) {
		const songKey = this.getSongKeyForActionId(event.action)
		if (songKey == null) { return }

		// End the previous segment at the cast time of the new song,
		// capped to the song's maximum duration.
		if (this.currentSegment != null && this.currentSegment.end == null) {
			this.currentSegment.end = Math.min(
				event.timestamp,
				this.currentSegment.start + SONG_MAX_DURATION,
			)
		}

		// If this song already appears in the current window, close it
		if (this.currentWindow != null) {
			const alreadyInWindow = this.currentWindow.segments.some(s => s.songKey === songKey)
			if (alreadyInWindow) {
				this.currentWindow.end = event.timestamp
				this.windows.push(this.currentWindow)
				this.currentWindow = undefined
			}
		}

		// Open a new window if there isn't one
		if (this.currentWindow == null) {
			this.currentWindow = {start: event.timestamp, segments: []}
		}

		// Start a new segment for this song
		this.currentSegment = {songKey, start: event.timestamp}
		this.currentWindow.segments.push(this.currentSegment)
	}

	// Priority 2: statusRemove ends the segment.
	private onSongStatusRemove(event: Events['statusRemove']) {
		const songKey = this.getSongKeyForStatusId(event.status)
		if (songKey == null || this.currentWindow == null) { return }

		const segment = this.currentWindow.segments.find(
			s => s.songKey === songKey && s.end == null,
		)
		if (segment != null) {
			segment.end = Math.min(event.timestamp, segment.start + SONG_MAX_DURATION)
		}
	}

	private onComplete() {
		if (this.currentWindow == null) { return }

		const endTime = this.parser.pull.timestamp + this.parser.pull.duration

		if (this.currentSegment != null && this.currentSegment.end == null) {
			this.currentSegment.end = Math.min(
				endTime,
				this.currentSegment.start + SONG_MAX_DURATION,
			)
		}

		this.currentWindow.end = endTime
		this.windows.push(this.currentWindow)
		this.currentWindow = undefined
	}

	private get maxWindowDuration(): number {
		if (this.windows.length === 0) { return 1 }
		return Math.max(...this.windows.map(w => (w.end ?? 0) - w.start))
	}

	override output() {
		if (this.windows.length === 0) { return }

		const actionNames = Object.fromEntries(
			SONG_KEYS.map(key => [key, this.data.actions[key].name]),
		) as Record<SongKey, string>

		return <SongsWindowsOutput
			windows={this.windows}
			maxWindowDuration={this.maxWindowDuration}
			pullTimestamp={this.parser.pull.timestamp}
			actionNames={actionNames}
		/>
	}
}
