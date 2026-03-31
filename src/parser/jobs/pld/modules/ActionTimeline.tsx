import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		// Buffs
		'FIGHT_OR_FLIGHT',
		{content: 'IMPERATOR', minLevel: 96},
		{content: 'REQUIESCAT', minLevel: 68, maxLevel: 95},
		// oGCD Damage
		{content: 'EXPIACION', minLevel: 86},
		{content: 'SPIRITS_WITHIN', minLevel: 30, maxLevel: 85},
		'CIRCLE_OF_SCORN',
		'INTERVENE',
		'BLADE_OF_HONOR',
		// Gauge Mitigation
		'HOLY_SHELTRON',
		'INTERVENTION',
		// Personal Mitigation
		'BULWARK',
		'HALLOWED_GROUND',
		'SENTINEL',
		'GUARDIAN',
		'RAMPART',
		// Personal Utility
		'ARMS_LENGTH',
		// Party Mitigation
		'PASSAGE_OF_ARMS',
		'DIVINE_VEIL',
		'REPRISAL',
		'COVER',
		// Tank Utility
		'PROVOKE',
		'SHIRK',
		// Disrupt Utility
		'INTERJECT',
		'LOW_BLOW',
	]
}
