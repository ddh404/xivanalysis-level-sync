import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {DisengageGcds as CoreDisengageGcds} from 'parser/core/modules/DisengageGcds'

export class ShieldLob extends CoreDisengageGcds {
	override disengageTitle = <Trans id="pld.disengage.statistic.title">Shield Lob Uses</Trans>
	override disengageAction = this.data.actions.SHIELD_LOB
	override disengageInfo = <Trans id="pld.disengage.statistic.info">
		While it is important to keep your GCD rolling as much as possible, try to minimize <DataLink action="SHIELD_LOB" /> since it does less damage than your combo actions.
	</Trans>
	override disengageIcon = this.data.actions.SHIELD_LOB.icon
}
