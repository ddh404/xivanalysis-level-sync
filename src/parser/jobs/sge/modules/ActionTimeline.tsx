import {Trans} from '@lingui/react/macro'
import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		// Addersgall actions
		{
			label: <Trans id="sge.actiontimeline.addersgall">Addersgall</Trans>,
			content: ['DRUOCHOLE', 'IXOCHOLE', 'TAUROCHOLE', 'KERACHOLE'],
		},
		'RHIZOMATA',
		// Eukrasia and related
		'EUKRASIA',
		'EUKRASIAN_DIAGNOSIS',
		'EUKRASIAN_PROGNOSIS',
		{content: 'EUKRASIAN_DOSIS_III', minLevel: 82},
		{content: 'EUKRASIAN_DOSIS_II', minLevel: 72, maxLevel: 81},
		{content: 'EUKRASIAN_DOSIS', minLevel: 30, maxLevel: 71},
		// DPS 'cooldowns'
		'PSYCHE',
		'PNEUMA',
		{content: 'PHLEGMA_III', minLevel: 82},
		{content: 'PHLEGMA_II', minLevel: 72, maxLevel: 81},
		{content: 'PHLEGMA', minLevel: 26, maxLevel: 71},
		// Cooldowns
		'PHILOSOPHIA',
		'HOLOS',
		'PANHAIMA',
		'HAIMA',
		{content: 'PHYSIS_II', minLevel: 60},
		{content: 'PHYSIS', minLevel: 20, maxLevel: 59},
		'ZOE',
		'KRASIS',
		// Kardia
		'KARDIA',
		'SOTERIA',
	]
}
