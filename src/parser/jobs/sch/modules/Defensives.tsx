import {Trans} from '@lingui/react/macro'
import {Action} from 'data/ACTIONS'
import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedActions = [
		this.data.actions.SCH_WHISPERING_DAWN,
		this.data.actions.SCH_FEY_ILLUMINATION,
		this.data.actions.SACRED_SOIL,
		this.data.actions.DEPLOYMENT_TACTICS,
		this.data.actions.DISSIPATION,
		this.data.actions.RECITATION,
		this.data.actions.SCH_FEY_BLESSING,
		this.data.actions.SUMMON_SERAPH,
		this.data.actions.PROTRACTION,
		this.data.actions.EXPEDIENT,
		this.data.actions.SERAPHISM,
	]

	protected override actionLevelGates = {
		[this.data.actions.SCH_WHISPERING_DAWN.id]: {minLevel: 20},
		[this.data.actions.SCH_FEY_ILLUMINATION.id]: {minLevel: 40},
		[this.data.actions.SACRED_SOIL.id]:          {minLevel: 50},
		[this.data.actions.DEPLOYMENT_TACTICS.id]:   {minLevel: 56},
		[this.data.actions.DISSIPATION.id]:          {minLevel: 60},
		[this.data.actions.RECITATION.id]:            {minLevel: 74},
		[this.data.actions.SCH_FEY_BLESSING.id]:      {minLevel: 76},
		[this.data.actions.SUMMON_SERAPH.id]:         {minLevel: 80},
		[this.data.actions.PROTRACTION.id]:           {minLevel: 86},
		[this.data.actions.EXPEDIENT.id]:             {minLevel: 90},
		[this.data.actions.SERAPHISM.id]:             {minLevel: 100},
	}

	protected override getEffectiveCooldown(action: Action): number {
		const level = this.actors.current.level
		if (action.id === this.data.actions.RECITATION.id && level != null && level < 98) {
			return 90000
		}
		if (action.id === this.data.actions.DEPLOYMENT_TACTICS.id && level != null && level < 88) {
			return 120000
		}
		return super.getEffectiveCooldown(action)
	}

	// Retaining the old trans ID
	protected override headerContent = <Trans id="sch.cooldownDowntime.defense-cd-metric">
		Using your mitigation and healing cooldowns allows you to help keep the party healthy while continuing to deal damage.
		While you shouldn't waste these actions, you should try to plan out when to use them to maximize their utility.
	</Trans>
}
