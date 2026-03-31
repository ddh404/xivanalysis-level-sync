import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedActions = [
		this.data.actions.HALLOWED_GROUND,
		this.data.actions.SENTINEL,
		this.data.actions.GUARDIAN,
		this.data.actions.PASSAGE_OF_ARMS,
		this.data.actions.DIVINE_VEIL,
		this.data.actions.BULWARK,
	]

	protected override actionLevelGates = {
		[this.data.actions.HALLOWED_GROUND.id]: {minLevel: 50},
		[this.data.actions.SENTINEL.id]:        {minLevel: 38, maxLevel: 91},
		[this.data.actions.GUARDIAN.id]:        {minLevel: 92},
		[this.data.actions.PASSAGE_OF_ARMS.id]: {minLevel: 70},
		[this.data.actions.DIVINE_VEIL.id]:     {minLevel: 56},
		[this.data.actions.BULWARK.id]:         {minLevel: 52},
	}
}
