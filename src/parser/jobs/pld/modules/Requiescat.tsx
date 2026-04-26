import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, EvaluationOutput, ExpectedActionsEvaluator, TrackedAction, TrackedActionsOptions} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {EndOfWindowHandlingMode} from 'parser/core/modules/ActionWindow/windows/BuffWindow'
import {Actors} from 'parser/core/modules/Actors'
import {Downtime} from 'parser/core/modules/Downtime'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Fragment} from 'react'
import {Message} from 'semantic-ui-react'

const SEVERITIES = {
	MISSED_CASTS: {
		1: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	},
	MISSED_CONFITEOR_GCDS: {
		1: SEVERITY.MAJOR,
	},
}
const REQUIESCAT_DURATION = 30000

const DIVINE_MIGHT_ACTIONS: ActionKey[] = [
	'HOLY_SPIRIT',
	'HOLY_CIRCLE',
]

const REQUIESCAT_ACTIONS: ActionKey[] = [
	'HOLY_SPIRIT',
	'HOLY_CIRCLE',
	'CONFITEOR',
	'BLADE_OF_FAITH',
	'BLADE_OF_TRUTH',
	'BLADE_OF_VALOR',
]

interface LevelFilteredActionsOptions extends TrackedActionsOptions {
	shouldShowAction: (action: TrackedAction) => boolean
}

class LevelFilteredActionsEvaluator extends ExpectedActionsEvaluator {
	private readonly shouldShowAction: (action: TrackedAction) => boolean

	constructor(opts: LevelFilteredActionsOptions) {
		super(opts)
		this.shouldShowAction = opts.shouldShowAction
	}

	override output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput[] {
		return super.output(windows).filter((_, i) => this.shouldShowAction(this.expectedActions[i]))
	}
}

export class Requiescat extends BuffWindow {
	static override handle = 'requiescat'
	static override title = msg({id: 'pld.requiescat.title', message: 'Requiescat Usage'})

	@dependency actors!: Actors
	@dependency downtime!: Downtime
	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.REQUIESCAT
	override endOfWindowHandlingMode: EndOfWindowHandlingMode = 'SAME-TIMESTAMP'

	private requiescatUsages = 0

	override initialise() {
		super.initialise()

		const actionFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
		const isDivineMightAction = this.data.matchActionId(DIVINE_MIGHT_ACTIONS)
		const isRequiescatAction = this.data.matchActionId(REQUIESCAT_ACTIONS)
		this.setEventFilter((event): event is Events['action'] => {
			if (!actionFilter(event)) { return false }

			// If the player has divine might active, the holy spells can be ignored, they do not consume requi stacks.
			if (
				this.actors.current.hasStatus(this.data.statuses.DIVINE_MIGHT.id)
				&& isDivineMightAction(event.action)
			) {
				return false
			}

			// Otherwise, report any action effected by requi.
			return isRequiescatAction(event.action)
		})

		const bladeIds = [
			this.data.actions.BLADE_OF_FAITH.id,
			this.data.actions.BLADE_OF_TRUTH.id,
			this.data.actions.BLADE_OF_VALOR.id,
		]

		this.addEvaluator(new LevelFilteredActionsEvaluator({
			shouldShowAction: (action) => {
				if (bladeIds.includes(action.action.id)) {
					const level = this.actors.current.level
					return level == null || level > 80
				}
				return true
			},
			expectedActions: [
				{action: this.data.actions.CONFITEOR, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_FAITH, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_TRUTH, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_VALOR, expectedPerWindow: 1},
				{action: this.data.actions.HOLY_SPIRIT, expectedPerWindow: 0},
			],
			suggestionIcon: this.data.actions.REQUIESCAT.icon,
			suggestionContent: <Trans id="pld.requiescat.suggestions.missed-confiteor.content">
				Be sure to use <DataLink action="CONFITEOR" />, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
				, and <DataLink action="BLADE_OF_VALOR" /> in each <DataLink status="REQUIESCAT" /> window for optimal damage.
			</Trans>,
			suggestionWindowName: <DataLink action="REQUIESCAT" showIcon={false} />,
			severityTiers: SEVERITIES.MISSED_CONFITEOR_GCDS,
			adjustCount: this.adjustExpectedActionCount.bind(this),
		}))

		this.addEventHook({type: 'action', source: this.parser.actor.id, action: this.data.actions.REQUIESCAT.id}, () => this.requiescatUsages++)
	}

	private adjustExpectedActionCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction): number {
		const level = this.actors.current.level
		const isLowLevel = level != null && level <= 80
		const downtimeAdjust = this.calculateDowntimeAdjustment(window)

		if (action.action.id === this.data.actions.BLADE_OF_FAITH.id
			|| action.action.id === this.data.actions.BLADE_OF_TRUTH.id
			|| action.action.id === this.data.actions.BLADE_OF_VALOR.id) {
			return isLowLevel ? -action.expectedPerWindow : downtimeAdjust
		}

		if (action.action.id === this.data.actions.HOLY_SPIRIT.id) {
			return isLowLevel ? 3 + downtimeAdjust : 0
		}

		return downtimeAdjust
	}

	private calculateDowntimeAdjustment(window: HistoryEntry<EvaluatedAction[]>): number {
		if (window.end == null) { return 0 }
		const originalWindowEnd = window.start + REQUIESCAT_DURATION
		const downtimeInWindow = this.downtime.getDowntime(window.start, originalWindowEnd)
		const adjustedWindowEnd = originalWindowEnd - downtimeInWindow
		if (adjustedWindowEnd - window.start < this.globalCooldown.getDuration()) {
			return -1
		}
		return 0
	}

	override output() {
		const level = this.actors.current.level
		const isLowLevel = level != null && level <= 80

		return <Fragment>
			<Message>
				{isLowLevel
					? <Trans id="pld.requiescat.table.note.low-level">Each of your <DataLink status="REQUIESCAT" /> windows should contain 4 spells
					, consisting of <DataLink action="CONFITEOR" /> and three <DataLink action="HOLY_SPIRIT" />.</Trans>
					: <Trans id="pld.requiescat.table.note">Each of your <DataLink status="REQUIESCAT" /> windows should contain 4 spells
					, consisting of <DataLink action="CONFITEOR" />, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
					, and <DataLink action="BLADE_OF_VALOR" /> for each each stack <DataLink status="REQUIESCAT" />.</Trans>
				}
			</Message>
			<>{super.output()}</>
		</Fragment>
	}
}
