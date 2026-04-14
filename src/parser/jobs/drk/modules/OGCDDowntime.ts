import {Event} from 'event'
import {filter} from 'parser/core/filter'
import {CooldownDowntime, CooldownGroup} from 'parser/core/modules/CooldownDowntime'

export class OGCDDowntime extends CooldownDowntime {

	private numberOfScorns = 0

	override trackedCds = [
		{
			cooldowns: [this.data.actions.DELIRIUM],
			firstUseOffset: 10000,
			minLevel: 68,
		},
		{
			cooldowns: [this.data.actions.BLOOD_WEAPON],
			firstUseOffset: 10000,
			minLevel: 35,
			maxLevel: 67,
		},
		{
			cooldowns: [this.data.actions.SALTED_EARTH],
			firstUseOffset: 12500,
			minLevel: 52,
		},
		{
			cooldowns: [this.data.actions.CARVE_AND_SPIT, this.data.actions.ABYSSAL_DRAIN],
			firstUseOffset: 17500,
			minLevel: 60,
		},
		{
			cooldowns: [this.data.actions.SHADOWBRINGER],
			firstUseOffset: 20000,
			minLevel: 90,
		},
		{
			cooldowns: [this.data.actions.LIVING_SHADOW],
			firstUseOffset: 5000,
			minLevel: 80,
		},
	]

	override initialise() {
		super.initialise()
		const statusApplyFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type("statusApply")

		this.addEventHook(statusApplyFilter.status(this.data.statuses.SCORN.id), this.scornUsed)
	}

	override calculateUsageCount(group: CooldownGroup): number {
		const usageCount = super.calculateUsageCount(group)
		// Note: we index off Scorn being applied instead of Living Shadow being used
		// since this captures pre-pull Living Shadows too. fflogs does not include
		// Living Shadows used pre-pull, but it does include Scorn.
		// We still want to check if Scorn >= usageCount since Scorn does not exist
		// at lower levels.
		if (group.cooldowns.includes(this.data.actions.LIVING_SHADOW)) {
			if (this.numberOfScorns >= usageCount) {
				return this.numberOfScorns
			}
		}
		return usageCount

	}

	private scornUsed() {
		this.numberOfScorns++
	}
}
