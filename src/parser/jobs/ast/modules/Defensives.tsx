import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedActions = [
		this.data.actions.CELESTIAL_INTERSECTION,
		this.data.actions.CELESTIAL_OPPOSITION,
		this.data.actions.EARTHLY_STAR,
		this.data.actions.MACROCOSMOS,
		this.data.actions.EXALTATION,
		this.data.actions.HOROSCOPE,
		this.data.actions.NEUTRAL_SECT,
		this.data.actions.COLLECTIVE_UNCONSCIOUS,
	]

	protected override actionLevelGates = {
		[this.data.actions.COLLECTIVE_UNCONSCIOUS.id]:  {minLevel: 58},
		[this.data.actions.CELESTIAL_OPPOSITION.id]:    {minLevel: 60},
		[this.data.actions.EARTHLY_STAR.id]:            {minLevel: 62},
		[this.data.actions.CELESTIAL_INTERSECTION.id]:  {minLevel: 74},
		[this.data.actions.HOROSCOPE.id]:               {minLevel: 76},
		[this.data.actions.NEUTRAL_SECT.id]:            {minLevel: 80},
		[this.data.actions.EXALTATION.id]:              {minLevel: 86},
		[this.data.actions.MACROCOSMOS.id]:             {minLevel: 90},
	}
}
