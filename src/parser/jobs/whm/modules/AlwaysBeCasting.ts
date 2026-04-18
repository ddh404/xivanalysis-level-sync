import {HealerAlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting/HealerAlwaysBeCasting'

export class AlwaysBeCasting extends HealerAlwaysBeCasting {
	protected override get raiseAction() {
		return this.data.actions.RAISE
	}
}
