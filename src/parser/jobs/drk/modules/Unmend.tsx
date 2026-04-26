import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {DisengageGcds as CoreDisengageGcds} from 'parser/core/modules/DisengageGcds'

export class Unmend extends CoreDisengageGcds {
	override disengageTitle = <Trans id="drk.disengage.statistic.title">Unmend Uses</Trans>
	override disengageAction = this.data.actions.UNMEND
	override disengageInfo = <Trans id="drk.disengage.statistic.info">
		While it is important to keep your GCD rolling as much as possible, try to minimize <DataLink action="UNMEND" /> since it does less damage than your combo actions.
	</Trans>
	override disengageIcon = this.data.actions.UNMEND.icon
}
