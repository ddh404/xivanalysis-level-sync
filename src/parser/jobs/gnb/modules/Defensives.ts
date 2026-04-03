import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'
import {DISPLAY_ORDER} from 'parser/jobs/gnb/modules/DISPLAY_ORDER'

export class Defensives extends CoreDefensives {
	static override displayOrder = DISPLAY_ORDER.DEFENSIVES
	protected override trackedActions = [
		this.data.actions.SUPERBOLIDE,
		this.data.actions.NEBULA,
		this.data.actions.GREAT_NEBULA,
		this.data.actions.HEART_OF_LIGHT,
		this.data.actions.HEART_OF_STONE,
		this.data.actions.HEART_OF_CORUNDUM,
		this.data.actions.AURORA,
		this.data.actions.CAMOUFLAGE,
	]

	protected override actionLevelGates = {
		[this.data.actions.SUPERBOLIDE.id]: {minLevel: 50},
		[this.data.actions.NEBULA.id]: {minLevel: 38, maxLevel: 91},
		[this.data.actions.GREAT_NEBULA.id]: {minLevel: 92},
		[this.data.actions.HEART_OF_LIGHT.id]: {minLevel: 64},
		[this.data.actions.HEART_OF_STONE.id]: {minLevel: 68, maxLevel: 81},
		[this.data.actions.HEART_OF_CORUNDUM.id]: {minLevel: 82},
		[this.data.actions.AURORA.id]: {minLevel: 45},
		[this.data.actions.CAMOUFLAGE.id]: {minLevel: 6},
	}
}
