import {Action} from 'data/ACTIONS'
import {Trans} from '@lingui/react/macro'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {AlwaysBeCasting} from './AlwaysBeCasting'

interface RaiseWindow {
	start: number
	end: number
}

/**
 * Base AlwaysBeCasting module for healer jobs.
 * Excludes time spent casting (or attempting to cast) a raise/resurrection
 * spell from the GCD uptime calculation, including self-interrupted casts.
 */
export abstract class HealerAlwaysBeCasting extends AlwaysBeCasting {
	/** The job's raise/resurrection action. Must be overridden in subclasses. */
	protected abstract get raiseAction(): Action

	private raiseWindows: RaiseWindow[] = []
	private currentRaisePrepare: number | undefined

	override initialise() {
		// Register before super so this runs before the base class's onComplete,
		// ensuring any in-progress raise window is closed before uptime is calculated.
		this.addEventHook('complete', this.onCompleteRaise)

		super.initialise()

		const raiseFilter = filter<Event>()
			.source(this.parser.actor.id)
			.action(this.raiseAction.id)

		this.addEventHook(raiseFilter.type('prepare'), this.onRaisePrepare)
		this.addEventHook(raiseFilter.type('action'), this.onRaiseAction)
		this.addEventHook(raiseFilter.type('interrupt'), this.onRaiseInterrupt)
	}

	private onRaisePrepare(event: Events['prepare']) {
		this.currentRaisePrepare = event.timestamp
	}

	private onRaiseAction(event: Events['action']) {
		if (this.currentRaisePrepare != null) {
			// Hard cast: window spans from cast start to cast completion
			this.raiseWindows.push({start: this.currentRaisePrepare, end: event.timestamp})
		} else {
			// Instant cast (e.g. Swiftcast): window spans one GCD recast from action fire
			const recastTime = this.castTime.recastForEvent(event) ?? this.globalCooldown.getDuration()
			this.raiseWindows.push({start: event.timestamp, end: event.timestamp + recastTime})
		}
		this.currentRaisePrepare = undefined
	}

	private onRaiseInterrupt(event: Events['interrupt']) {
		if (this.currentRaisePrepare != null) {
			// Cast was self-interrupted: window spans the attempted cast duration
			this.raiseWindows.push({start: this.currentRaisePrepare, end: event.timestamp})
			this.currentRaisePrepare = undefined
		}
	}

	private onCompleteRaise(event: Events['complete']) {
		// Close any raise window still open at fight end (e.g. raise being cast on last pull)
		if (this.currentRaisePrepare != null) {
			this.raiseWindows.push({start: this.currentRaisePrepare, end: event.timestamp})
			this.currentRaisePrepare = undefined
		}
	}

	override considerCast(action: Action, castStart: number): boolean {
		if (action === this.raiseAction) {
			return false
		}
		return super.considerCast(action, castStart)
	}

	protected override getExtraExcludedWindows() {
		return this.raiseWindows
	}

	protected override get gcdUptimeRequirementNote() {
		return <div style={{color: 'grey', fontSize: '0.9em'}}>
			<Trans id="core.always-cast.gcd-uptime.healer-note">(time unable to act excluded: death, untargetable boss, fetters, stun, knockback, raise cast...)</Trans>
		</div>
	}
}
