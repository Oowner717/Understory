import { useEffect, useState, lazy, Suspense } from 'react'
import { AppProvider } from './AppContext'
import { STR } from './content/ui-strings'
import { CardDetail } from './views/CardDetail'
import { EntryView } from './views/EntryView'
import { Journal } from './views/Journal'
import { Library } from './views/Library'
import { Settings } from './views/Settings'
import { Spread } from './views/Spread'
import { Today } from './views/Today'

type Route = { view: string; param?: string }

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [view = 'today', ...rest] = raw.split('/')
  return { view: view || 'today', param: rest.length ? decodeURIComponent(rest.join('/')) : undefined }
}

function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash)
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

const NAV = [
  { hash: '#/today', label: STR.nav.today, match: ['today'] },
  { hash: '#/journal', label: STR.nav.journal, match: ['journal', 'entry'] },
  { hash: '#/library', label: STR.nav.library, match: ['library', 'card'] },
  { hash: '#/spread', label: STR.nav.spread, match: ['spread'] },
  { hash: '#/settings', label: STR.nav.settings, match: ['settings'] },
]

// Dev-only writing dashboard. import.meta.env.DEV is false in production
// builds, so the dynamic import (and the whole dashboard chunk) is dropped.
const Writing = import.meta.env.DEV ? lazy(() => import('./views/Writing')) : null

function View({ route }: { route: Route }) {
  if (route.view === 'writing' && Writing) {
    return (
      <Suspense fallback={null}>
        <Writing />
      </Suspense>
    )
  }
  switch (route.view) {
    case 'journal':
      return <Journal />
    case 'entry':
      return <EntryView id={route.param ?? ''} />
    case 'library':
      return <Library />
    case 'card':
      return <CardDetail id={route.param ?? ''} />
    case 'spread':
      return <Spread />
    case 'settings':
      return <Settings />
    default:
      return <Today />
  }
}

export default function App() {
  const route = useHashRoute()

  return (
    <AppProvider>
      <a className="skip-link" href="#main">
        {STR.app.skipLink}
      </a>
      <header className="masthead">
        <a href="#/today" className="wordmark">
          {STR.app.wordmark}
        </a>
      </header>
      <main
        id="main"
        className={`main${route.view === 'library' || route.view === 'writing' ? ' main--wide' : ''}`}
      >
        <View route={route} />
      </main>
      <nav className="tabbar" aria-label={STR.nav.ariaLabel}>
        {NAV.map((item) => (
          <a
            key={item.hash}
            href={item.hash}
            aria-current={item.match.includes(route.view) ? 'page' : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </AppProvider>
  )
}
