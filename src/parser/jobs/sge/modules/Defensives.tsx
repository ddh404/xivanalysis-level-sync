import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedActions = [
		this.data.actions.KERACHOLE,
		this.data.actions.PHILOSOPHIA,
		this.data.actions.PNEUMA,
		this.data.actions.HOLOS,
		this.data.actions.PANHAIMA,
		this.data.actions.HAIMA,
		this.data.actions.PHYSIS,
		this.data.actions.PHYSIS_II,
		this.data.actions.SOTERIA,
		this.data.actions.RHIZOMATA,
		this.data.actions.KRASIS,
	]

	protected override actionLevelGates = {
		[this.data.actions.KERACHOLE.id]:   {minLevel: 50},
		[this.data.actions.PHILOSOPHIA.id]: {minLevel: 100},
		[this.data.actions.PNEUMA.id]:      {minLevel: 90},
		[this.data.actions.HOLOS.id]:       {minLevel: 76},
		[this.data.actions.PANHAIMA.id]:    {minLevel: 80},
		[this.data.actions.HAIMA.id]:       {minLevel: 70},
		[this.data.actions.PHYSIS.id]:      {minLevel: 20, maxLevel: 59},
		[this.data.actions.PHYSIS_II.id]:   {minLevel: 60},
		[this.data.actions.SOTERIA.id]:     {minLevel: 35},
		[this.data.actions.RHIZOMATA.id]:   {minLevel: 74},
		[this.data.actions.KRASIS.id]:      {minLevel: 86},
	}

	// Retaining old Trans ID to maintain i18n
	protected override headerContent = <Trans id="sge.cooldownDowntime.defense-cd-metric">
		Using your mitigation and healing cooldowns allows you to help keep the party healthy while continuing to deal damage to enemies and healing to your <DataLink showIcon={false} action="KARDIA" /> target.
		While you shouldn't waste these actions, you should try to plan out when to use them to maximize their utility.
	</Trans>
}
