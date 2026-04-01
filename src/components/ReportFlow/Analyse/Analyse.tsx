import * as Sentry from '@sentry/browser'
import {SidebarContent} from 'components/GlobalSidebar'
import {JobIcon} from 'components/ui/JobIcon'
import {NormalisedMessage} from 'components/ui/NormalisedMessage'
import {AnalysisLoader} from 'components/ui/SharedLoaders'
import {JOBS, ROLES} from 'data/JOBS'
import {Attribute, Events, PREPULL_EVENT_WINDOW} from 'event'
import {Meta} from 'parser/core/Meta'
import {Parser, Result} from 'parser/core/Parser'
import {useContext, useEffect, useState} from 'react'
import {Actor, Pull, Report} from 'report'
import {ReportStore} from 'reportSources'
import {Header} from 'semantic-ui-react'
import {StoreContext} from 'store'
import {getSpeedStat} from 'utilities/speedStatMapper'
import styles from './Analyse.module.css'
import {GcdOverrideContext} from './GcdOverrideContext'
import {ResultSegment} from './ResultSegment'
import {SegmentLinkItem} from './SegmentLinkItem'
import {SegmentPositionProvider} from './SegmentPositionContext'

export interface AnalyseProps {
	reportStore: ReportStore
	meta: Meta
	report: Report
	pull: Pull
	actor: Actor
}

export function Analyse({
	reportStore,
	meta,
	report,
	pull,
	actor,
}: AnalyseProps) {
	const {globalErrorStore} = useContext(StoreContext)

	const [results, setResults] = useState<readonly Result[]>()
	const [gcdOverride, setGcdOverride] = useState<number | undefined>(undefined)

	useEffect(() => {
		let cancelled = false
		setResults(undefined)
		analyseReport(reportStore, meta, report, pull, actor, gcdOverride)
			.then(results => { if (!cancelled) { setResults(results) } })
			.catch(error => {
				if (cancelled) { return }
				Sentry.captureException(error)
				globalErrorStore.setGlobalError(error)
			})
		return () => { cancelled = true }
	}, [reportStore, meta, report, pull, actor, globalErrorStore, gcdOverride])

	if (results == null) {
		return <AnalysisLoader/>
	}

	const job = JOBS[actor.job]
	const role = ROLES[job.role]

	return (
		<GcdOverrideContext.Provider value={{gcdOverride, setGcdOverride}}>
		<SegmentPositionProvider>
			<SidebarContent>
				{job && (
					<Header className={styles.header}>
						<JobIcon job={job}/>
						<Header.Content>
							<NormalisedMessage message={job.name}/>
							<Header.Subheader>
								<NormalisedMessage message={role.name}/>
							</Header.Subheader>
						</Header.Content>
					</Header>
				)}

				{results.map((result, index) => (
					<SegmentLinkItem
						key={result.handle}
						index={index}
						result={result}
					/>
				))}
			</SidebarContent>

			<div className={styles.resultsContainer}>
				{results.map((result, index) => (
					<ResultSegment key={result.handle} index={index} result={result}/>
				))}
			</div>
		</SegmentPositionProvider>
		</GcdOverrideContext.Provider>
	)
}

async function analyseReport(
	reportStore: ReportStore,
	meta: Meta,
	report: Report,
	pull: Pull,
	actor: Actor,
	gcdOverride: number | undefined,
) {
	// Build the base parser instance
	const parser = new Parser({
		meta,
		report,
		pull,
		actor,
	})

	// Parser configuration and event fetching can be executed simultaneously
	const [events] = await Promise.all([
		reportStore.fetchEvents(pull.id, actor.id),
		parser.configure(),
	])

	// If the user has specified a GCD override, replace estimated speed stat events
	// so all modules see the correct value from the very start of event processing.
	// Placing the override at the beginning ensures getDuration() returns the right
	// value when module hooks fire for each action — not just during onComplete.
	let allEvents = events
	if (gcdOverride != null) {
		const speedStat = JOBS[actor.job].speedStat

		// Strip all speed stat attributes from existing actorUpdate events so the
		// override is the sole source — non-estimated (precise) values from the log
		// would otherwise shadow the override since getHistoricalValue searches newest-first.
		const filteredEvents = events.map(event => {
			if (event.type !== 'actorUpdate' || event.attributes == null) {
				return event
			}
			const kept = event.attributes.filter(
				attr => attr.attribute !== speedStat
			)
			if (kept.length === event.attributes.length) { return event }
			return {...event, attributes: kept.length > 0 ? kept : undefined}
		})

		// Prepend override as the very first event so it precedes all action events
		const overrideEvent: Events['actorUpdate'] = {
			type: 'actorUpdate',
			timestamp: pull.timestamp - PREPULL_EVENT_WINDOW,
			actor: actor.id,
			attributes: [{
				attribute: speedStat as Attribute,
				value: getSpeedStat(gcdOverride * 1000),
				estimated: false,
			}],
		}
		allEvents = [overrideEvent, ...filteredEvents]
	}

	// TODO: Batching?
	parser.parseEvents({events: allEvents})

	return parser.generateResults()
}
