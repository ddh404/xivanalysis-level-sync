import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {
	BuffWindow,
	EvaluatedAction,
	EvaluationOutput,
	ExpectedActionGroupsEvaluator,
	ExpectedActionsEvaluator,
	ExpectedGcdCountEvaluator,
	TrackedAction,
	TrackedActionGroup,
	TrackedActionGroupsOptions,
	TrackedActionsOptions,
	WindowEvaluator,
} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'

const SEVERITIES = {
	MISSED_OGCDS: {
		1: SEVERITY.MINOR,
		5: SEVERITY.MEDIUM,
	},
	MISSED_ACTIONS: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
	MISSED_GCDS: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
}

// These GCDs should not count towards the FoF GCD counter, as they are not
// physical damage (weaponskill) GCDs.
const EXCLUDED_ACTIONS: ActionKey[] = [
	'CLEMENCY',
]

/** Wraps an evaluator and only produces output/suggestions when the condition is met. */
class ConditionalEvaluator implements WindowEvaluator {
	constructor(
		private inner: WindowEvaluator,
		private condition: () => boolean,
	) {}

	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		return this.condition() ? this.inner.suggest(windows) : undefined
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput | EvaluationOutput[] | undefined {
		return this.condition() ? this.inner.output(windows) : undefined
	}
}

/**
 * At level ≤ 80, Holy Spirit tracked standalone (expected 3); excess HS beyond that
 * overflows into the RA group count instead of being double-counted.
 */
class LowLevelRaGroupEvaluator extends ExpectedActionGroupsEvaluator {
	constructor(
		opts: TrackedActionGroupsOptions,
		private readonly getLevel: () => number | undefined,
		private readonly holySpirit: {id: number},
		private readonly standaloneHsExpected: number,
	) {
		super(opts)
	}

	protected override countUsed(window: HistoryEntry<EvaluatedAction[]>, actionGroup: TrackedActionGroup): number {
		const level = this.getLevel()
		if (level == null || level > 80) {
			return super.countUsed(window, actionGroup)
		}
		const hsUsed = window.data.filter(c => c.action.id === this.holySpirit.id).length
		const nonHsCount = window.data.filter(
			cast => cast.action.id !== this.holySpirit.id
				&& actionGroup.actions.some(a => a.id === cast.action.id),
		).length
		return nonHsCount + Math.max(0, hsUsed - this.standaloneHsExpected)
	}
}

/** At level ≤ 80, caps the displayed actual count for Holy Spirit at the standalone expected value. */
class CappedHsActionsEvaluator extends ExpectedActionsEvaluator {
	constructor(
		opts: TrackedActionsOptions,
		private readonly holySpirit: {id: number},
		private readonly cap: number,
	) {
		super(opts)
	}

	protected override countUsed(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction): number {
		const raw = super.countUsed(window, action)
		if (action.action.id === this.holySpirit.id) {
			return Math.min(raw, this.cap)
		}
		return raw
	}
}

export class FightOrFlight extends BuffWindow {
	static override handle = 'fightorflight'
	static override title = msg({id: 'pld.fightorflight.title', message: 'Fight Or Flight Usage'})

	@dependency actors!: Actors
	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.FIGHT_OR_FLIGHT

	private get isLowLevel(): boolean {
		const level = this.actors.current.level
		return level != null && level <= 80
	}

	override initialise() {
		super.initialise()

		const suggestionWindowName = <DataLink action="FIGHT_OR_FLIGHT" showIcon={false} />

		this.ignoreActions(EXCLUDED_ACTIONS.map(g => this.data.actions[g].id))

		const actions = this.data.actions

		// GCD count
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 8,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon: actions.FIGHT_OR_FLIGHT.icon,
			suggestionContent: <Trans id="pld.fightorflight.suggestions.gcds.content">
				Try to land 8 GCDs during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSED_GCDS,
		}))

		// High-potency GCDs — level > 80: Goring Blade, Confiteor, Blade chain
		this.addEvaluator(new ConditionalEvaluator(
			new ExpectedActionsEvaluator({
				expectedActions: [
					{action: actions.GORING_BLADE, expectedPerWindow: 1},
					{action: actions.CONFITEOR, expectedPerWindow: 1},
					{action: actions.BLADE_OF_FAITH, expectedPerWindow: 1},
					{action: actions.BLADE_OF_TRUTH, expectedPerWindow: 1},
					{action: actions.BLADE_OF_VALOR, expectedPerWindow: 1},
				],
				suggestionIcon: actions.FIGHT_OR_FLIGHT.icon,
				suggestionContent: <Trans id="pld.fightorflight.suggestions.high_potency_gcd_actions.content">
					Try to land <DataLink action="GORING_BLADE" />, <DataLink action="CONFITEOR" />
					, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
					, and <DataLink action="BLADE_OF_VALOR" /> during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
				</Trans>,
				suggestionWindowName,
				severityTiers: SEVERITIES.MISSED_ACTIONS,
			}),
			() => !this.isLowLevel,
		))

		// High-potency GCDs — level ≤ 80: Goring Blade, Confiteor, 3× Holy Spirit (capped at 3)
		this.addEvaluator(new ConditionalEvaluator(
			new CappedHsActionsEvaluator(
				{
					expectedActions: [
						{action: actions.GORING_BLADE, expectedPerWindow: 1},
						{action: actions.CONFITEOR, expectedPerWindow: 1},
						{action: actions.HOLY_SPIRIT, expectedPerWindow: 3},
					],
					suggestionIcon: actions.FIGHT_OR_FLIGHT.icon,
					suggestionContent: <Trans id="pld.fightorflight.suggestions.high_potency_gcd_actions_low_level.content">
						Try to land <DataLink action="GORING_BLADE" />, <DataLink action="CONFITEOR" />
						, and three <DataLink action="HOLY_SPIRIT" /> during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
					</Trans>,
					suggestionWindowName,
					severityTiers: SEVERITIES.MISSED_ACTIONS,
				},
				actions.HOLY_SPIRIT,
				3,
			),
			() => this.isLowLevel,
		))

		// RA group — level-adaptive: at ≤ 80 excess Holy Spirit overflows into this group
		this.addEvaluator(new LowLevelRaGroupEvaluator(
			{
				expectedActionGroups: [{
					actions: [
						actions.ROYAL_AUTHORITY,
						actions.ATONEMENT,
						actions.SUPPLICATION,
						actions.SEPULCHRE,
						actions.HOLY_SPIRIT,
					],
					expectedPerWindow: 3,
				}],
				suggestionIcon: actions.FIGHT_OR_FLIGHT.icon,
				suggestionContent: <Trans id="pld.fightorflight.suggestions.low_potency_gcd_actions.content">
					Try to land three of <DataLink action="ROYAL_AUTHORITY" />, <DataLink action="ATONEMENT" />
					, <DataLink action="SUPPLICATION" />, <DataLink action="SEPULCHRE" />
					, or <DataLink status="DIVINE_MIGHT" /> empowered <DataLink action="HOLY_SPIRIT" /> during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
				</Trans>,
				suggestionWindowName,
				severityTiers: SEVERITIES.MISSED_ACTIONS,
			},
			() => this.actors.current.level,
			actions.HOLY_SPIRIT,
			3,
		))

		// OGCDs — level > 80: Blade of Honor, Expiacion, Circle of Scorn, Intervene
		this.addEvaluator(new ConditionalEvaluator(
			new ExpectedActionsEvaluator({
				expectedActions: [
					{action: actions.BLADE_OF_HONOR, expectedPerWindow: 1},
					{action: actions.EXPIACION, expectedPerWindow: 1},
					{action: actions.CIRCLE_OF_SCORN, expectedPerWindow: 1},
					{action: actions.INTERVENE, expectedPerWindow: 1},
				],
				suggestionIcon: actions.FIGHT_OR_FLIGHT.icon,
				suggestionContent: <Trans id="pld.fightorflight.suggestions.ogcds.content">
					Try to land at least one cast of each of your off-GCD skills (<DataLink action="BLADE_OF_HONOR" />
					, <DataLink action="EXPIACION" />, <DataLink action="CIRCLE_OF_SCORN" />, and <DataLink action="INTERVENE" /> )
					during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
				</Trans>,
				suggestionWindowName,
				severityTiers: SEVERITIES.MISSED_OGCDS,
			}),
			() => !this.isLowLevel,
		))

		// OGCDs — level ≤ 80: Spirits Within, Circle of Scorn, Intervene
		this.addEvaluator(new ConditionalEvaluator(
			new ExpectedActionsEvaluator({
				expectedActions: [
					{action: actions.SPIRITS_WITHIN, expectedPerWindow: 1},
					{action: actions.CIRCLE_OF_SCORN, expectedPerWindow: 1},
					{action: actions.INTERVENE, expectedPerWindow: 1},
				],
				suggestionIcon: actions.FIGHT_OR_FLIGHT.icon,
				suggestionContent: <Trans id="pld.fightorflight.suggestions.ogcds_low_level.content">
					Try to land at least one cast of each of your off-GCD skills (<DataLink action="SPIRITS_WITHIN" />
					, <DataLink action="CIRCLE_OF_SCORN" />, and <DataLink action="INTERVENE" />)
					during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
				</Trans>,
				suggestionWindowName,
				severityTiers: SEVERITIES.MISSED_OGCDS,
			}),
			() => this.isLowLevel,
		))
	}
}
