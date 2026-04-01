import {MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {GcdOverrideContext} from 'components/ReportFlow/Analyse/GcdOverrideContext'
import {TransMarkdown} from 'components/ui/TransMarkdown'
import {BASE_GCD} from 'data/CONSTANTS'
import {useContext, useState} from 'react'
import {Report} from 'report'
import {Button, Icon, Input, Message, Modal} from 'semantic-ui-react'
import {Analyser} from '../Analyser'
import {dependency} from '../Injectable'
import {Data} from './Data'
import {SpeedAdjustments} from './SpeedAdjustments'
import {SimpleStatistic, Statistics} from './Statistics'

const GCD_REASONABLE_MIN = 1.5  // seconds
const GCD_REASONABLE_MAX = 2.5  // seconds

function GcdEditValue({displayText}: {displayText: string}) {
	const {gcdOverride, setGcdOverride} = useContext(GcdOverrideContext)
	const [editOpen, setEditOpen] = useState(false)
	const [inputValue, setInputValue] = useState('')
	const [inputError, setInputError] = useState<string | undefined>()
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [pendingGcd, setPendingGcd] = useState<number | undefined>()

	const openEdit = () => {
		setInputValue(gcdOverride != null ? gcdOverride.toFixed(2) : '')
		setInputError(undefined)
		setEditOpen(true)
	}

	const handleConfirm = () => {
		const v = parseFloat(inputValue)
		if (isNaN(v) || v <= 0 || v > 9.99) {
			setInputError('Please enter a valid GCD between 0 and 9.99 seconds.')
			return
		}
		if (v < GCD_REASONABLE_MIN || v > GCD_REASONABLE_MAX) {
			setPendingGcd(v)
			setEditOpen(false)
			setConfirmOpen(true)
			return
		}
		setGcdOverride(v)
		setEditOpen(false)
	}

	return (
		<>
			{displayText}
			<Icon
				name="edit"
				link
				onClick={openEdit}
				style={{marginLeft: '0.3em', fontSize: '0.55em', verticalAlign: 'middle'}}
			/>

			<Modal open={editOpen} onClose={() => setEditOpen(false)} size="tiny">
				<Modal.Header>
					<Trans id="core.gcd.override.header">Set GCD Override</Trans>
				</Modal.Header>
				<Modal.Content>
					<p>
						<Trans id="core.gcd.override.desc">
							Enter the actual GCD recast time in seconds (e.g. 2.34).
							The analysis will re-run using this value.
						</Trans>
					</p>
					<Input
						type="number"
						step="0.01"
						min="0.01"
						max="9.99"
						value={inputValue}
						fluid
						onChange={(_, d) => {
							setInputValue(d.value)
							setInputError(undefined)
						}}
						placeholder="e.g. 2.34"
						error={inputError != null}
					/>
					{inputError != null && (
						<Message negative size="tiny">{inputError}</Message>
					)}
				</Modal.Content>
				<Modal.Actions>
					<Button onClick={() => setEditOpen(false)}>
						<Trans id="core.gcd.override.cancel">Cancel</Trans>
					</Button>
					<Button primary onClick={handleConfirm}>
						<Trans id="core.gcd.override.ok">Confirm</Trans>
					</Button>
				</Modal.Actions>
			</Modal>

			<Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} size="tiny">
				<Modal.Header>
					<Trans id="core.gcd.override.warn-header">Unusual GCD Value</Trans>
				</Modal.Header>
				<Modal.Content>
					<Message warning>
						<Trans id="core.gcd.override.warn-body">
							The GCD value {pendingGcd?.toFixed(2)}s is outside the typical
							range ({GCD_REASONABLE_MIN}s – {GCD_REASONABLE_MAX}s). Are you sure?
						</Trans>
					</Message>
				</Modal.Content>
				<Modal.Actions>
					<Button onClick={() => { setConfirmOpen(false); setEditOpen(true) }}>
						<Trans id="core.gcd.override.back">Go Back</Trans>
					</Button>
					<Button negative onClick={() => { setGcdOverride(pendingGcd!); setConfirmOpen(false) }}>
						<Trans id="core.gcd.override.use-anyway">Use Anyway</Trans>
					</Button>
				</Modal.Actions>
			</Modal>
		</>
	)
}

const estimateHelp: Record<Report['meta']['source'] | '__all', MessageDescriptor> = {
	__all: msg({id: 'core.gcd.no-statistics.v2', message: 'This GCD recast is an *estimate*, and may be incorrect. If it is reporting a GCD recast *longer* than reality, you likely need to focus on keeping your GCD rolling.'}),
	legacyFflogs: msg({id: 'core.gcd.estimate-help.fflogs', message: 'Precise attribute values are only available from FF Logs for the player who logged the report in ACT.'}),
}

export class GlobalCooldown extends Analyser {
	static override handle = 'gcd'

	@dependency private data!: Data
	@dependency private statistics!: Statistics
	@dependency private speedAdjustments!: SpeedAdjustments

	override initialise() {
		this.addEventHook('complete', this.onComplete)
	}

	/**
	 * Get the base recast time of the parsed actor's GCD cooldown group, in milliseconds.
	 * The value returned from this function _may_ be an estimate - check {@link GlobalCooldown.isEstimated}
	 * to see if it is.
	 */
	public getDuration() {
		return this.speedAdjustments.getAdjustedDuration({duration: BASE_GCD})
	}

	/** Returns whether the GCD duration calculated by this module is an estimate. */
	public isEstimated() {
		return this.speedAdjustments.isAdjustmentEstimated()
	}

	private onComplete() {
		const estimated = this.isEstimated()
		const displayText = this.parser.formatDuration(this.getDuration())

		this.statistics.add(new SimpleStatistic({
			title: estimated
				? <Trans id="core.gcd.estimated-gcd">Estimated GCD</Trans>
				: <Trans id="core.gcd.gcd">GCD Recast</Trans>,
			icon: this.data.actions.ATTACK.icon,
			value: <GcdEditValue displayText={displayText}/>,
			info: estimated ? <>
				<TransMarkdown source={estimateHelp.__all}/>
				<TransMarkdown source={estimateHelp[this.parser.report.meta.source]}/>
			</> : undefined,
		}))
	}
}
