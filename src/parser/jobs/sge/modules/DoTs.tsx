import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {StatusKey} from 'data/STATUSES'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Checklist, Requirement, Rule} from 'parser/core/modules/Checklist'
import {DoTs as CoreDoTs} from 'parser/core/modules/DoTs'
import {Suggestions, SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

const SEVERITIES = {
	CLIPPING: {
		6000: SEVERITY.MINOR,
		9000: SEVERITY.MEDIUM,
		12000: SEVERITY.MAJOR,
	},
}

export class DoTs extends CoreDoTs {

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions
	@dependency private readonly actors!: Actors

	protected override trackedStatuses = [
		this.data.statuses.EUKRASIAN_DOSIS_III.id,
		this.data.statuses.EUKRASIAN_DOSIS_II.id,
		this.data.statuses.EUKRASIAN_DOSIS.id,
		this.data.statuses.EUKRASIAN_DYSKRASIA.id,
	]

	private get activeDosisStatusKey(): StatusKey {
		const level = this.actors.get(this.parser.actor).level ?? 0
		if (level >= 82) { return 'EUKRASIAN_DOSIS_III' }
		if (level >= 72) { return 'EUKRASIAN_DOSIS_II' }
		return 'EUKRASIAN_DOSIS'
	}

	protected override addChecklistRules() {
		const dotUptimePct = this.getUptimePercent(this.data.statuses.EUKRASIAN_DOSIS_III.id) + this.getUptimePercent(this.data.statuses.EUKRASIAN_DOSIS_II.id) + this.getUptimePercent(this.data.statuses.EUKRASIAN_DOSIS.id) + this.getUptimePercent(this.data.statuses.EUKRASIAN_DYSKRASIA.id)
		const dosisStatusKey = this.activeDosisStatusKey
		this.checklist.add(new Rule({
			name: <Trans id="sge.dots.rule.name">Keep your DoT up</Trans>,
			description: <Trans id="sge.dots.rule.description">
				<DataLink status={dosisStatusKey} showIcon={false} showTooltip={false} /> makes up a good portion of your damage. Aim to keep this DoT up at all times. It can also be used to weave your Addersgall abilities or other cooldowns, or maneuver around without dropping GCD uptime.
			</Trans>,
			requirements: [
				new Requirement({
					name: <><DataLink status={dosisStatusKey} /> uptime</>,
					percent: dotUptimePct,
				}),
			],
		}))
	}

	protected addClippingSuggestions() {
		const dosisClipPerMinute = this.getClippingAmount(this.data.statuses.EUKRASIAN_DOSIS_III.id) + this.getClippingAmount(this.data.statuses.EUKRASIAN_DOSIS_II.id) + this.getClippingAmount(this.data.statuses.EUKRASIAN_DOSIS.id) + this.getClippingAmount(this.data.statuses.EUKRASIAN_DYSKRASIA.id)
		const dosisStatusKey = this.activeDosisStatusKey
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.statuses[dosisStatusKey].icon,
			content: <Trans id="sge.dots.suggestion.clip.content">
				Avoid refreshing <DataLink status={dosisStatusKey} /> significantly before it expires.
			</Trans>,
			why: <Trans id="sge.dots.suggestion.clip.why">
				An average of {this.parser.formatDuration(dosisClipPerMinute, 1)} seconds of <DataLink status={dosisStatusKey} /> clipped per minute due to early refreshes.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: dosisClipPerMinute,
		}))
	}
}
