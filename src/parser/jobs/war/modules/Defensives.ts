import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedActions = [
		this.data.actions.HOLMGANG,
		this.data.actions.DAMNATION,
		this.data.actions.VENGEANCE,
		this.data.actions.RAW_INTUITION,
		this.data.actions.BLOODWHETTING,
		this.data.actions.SHAKE_IT_OFF,
		this.data.actions.NASCENT_FLASH,
		this.data.actions.THRILL_OF_BATTLE,
		this.data.actions.EQUILIBRIUM,
	]

	protected override actionLevelGates = {
		[this.data.actions.THRILL_OF_BATTLE.id]: {minLevel: 30},
		[this.data.actions.HOLMGANG.id]:         {minLevel: 42},
		[this.data.actions.RAW_INTUITION.id]:    {minLevel: 56, maxLevel: 81},
		[this.data.actions.EQUILIBRIUM.id]:      {minLevel: 58},
		[this.data.actions.SHAKE_IT_OFF.id]:     {minLevel: 68},
		[this.data.actions.NASCENT_FLASH.id]:    {minLevel: 76},
		[this.data.actions.BLOODWHETTING.id]:    {minLevel: 82},
		[this.data.actions.VENGEANCE.id]:        {minLevel: 38, maxLevel: 91},
		[this.data.actions.DAMNATION.id]:        {minLevel: 92},
	}
}
