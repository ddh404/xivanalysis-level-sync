import {CooldownDowntime as CoreCooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export class CooldownDowntime extends CoreCooldownDowntime {
	static override debug = false
	trackedCds = [
		{
			cooldowns: [this.data.actions.FIGHT_OR_FLIGHT],
			// Standard opener uses after 3rd GCD
			firstUseOffset: 7500,
			minLevel: 2,
		},
		{
			cooldowns: [this.data.actions.IMPERATOR],
			// Standard opener uses after 3rd GCD
			firstUseOffset: 7500,
			minLevel: 96,
		},
		{
			cooldowns: [this.data.actions.REQUIESCAT],
			// Standard opener uses after 3rd GCD
			firstUseOffset: 7500,
			minLevel: 68,
			maxLevel: 95,
		},
		{
			cooldowns: [this.data.actions.EXPIACION],
			// Standard opener uses after 4th GCD
			firstUseOffset: 10000,
			minLevel: 86,
		},
		{
			cooldowns: [this.data.actions.SPIRITS_WITHIN],
			// Standard opener uses after 4th GCD
			firstUseOffset: 10000,
			minLevel: 30,
			maxLevel: 85,
		},
		{
			cooldowns: [this.data.actions.CIRCLE_OF_SCORN],
			// Standard opener uses after 4th GCD
			firstUseOffset: 10000,
			minLevel: 50,
		},
		{
			cooldowns: [this.data.actions.INTERVENE],
			// Standard opener uses after 5th GCD
			firstUseOffset: 12500,
			minLevel: 66,
		},
	]
}
