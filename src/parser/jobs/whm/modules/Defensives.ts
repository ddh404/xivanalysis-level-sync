import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedActions = [
		this.data.actions.LITURGY_OF_THE_BELL,
		this.data.actions.ASYLUM,
		this.data.actions.AQUAVEIL,
		this.data.actions.DIVINE_BENISON,
		this.data.actions.PLENARY_INDULGENCE,
		this.data.actions.TEMPERANCE,
	]

	protected override actionLevelGates = {
		[this.data.actions.ASYLUM.id]:              {minLevel: 52},
		[this.data.actions.DIVINE_BENISON.id]:      {minLevel: 66},
		[this.data.actions.PLENARY_INDULGENCE.id]:  {minLevel: 70},
		[this.data.actions.TEMPERANCE.id]:          {minLevel: 80},
		[this.data.actions.AQUAVEIL.id]:            {minLevel: 86},
		[this.data.actions.LITURGY_OF_THE_BELL.id]: {minLevel: 90},
	}
}
