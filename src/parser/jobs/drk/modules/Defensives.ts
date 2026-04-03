import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedActions = [
		this.data.actions.THE_BLACKEST_NIGHT,
		this.data.actions.DARK_MIND,
		this.data.actions.LIVING_DEAD,
		this.data.actions.DARK_MISSIONARY,
		this.data.actions.OBLATION,
		this.data.actions.SHADOW_WALL,
		this.data.actions.SHADOWED_VIGIL,
	]

	protected override actionLevelGates = {
		[this.data.actions.THE_BLACKEST_NIGHT.id]: {minLevel: 70},
		[this.data.actions.DARK_MIND.id]: {minLevel: 45},
		[this.data.actions.LIVING_DEAD.id]: {minLevel: 50},
		[this.data.actions.DARK_MISSIONARY.id]: {minLevel: 66},
		[this.data.actions.OBLATION.id]: {minLevel: 82},
		[this.data.actions.SHADOW_WALL.id]: {minLevel: 38, maxLevel: 91},
		[this.data.actions.SHADOWED_VIGIL.id]: {minLevel: 92},
	}
}
