import { useEffect, useState } from 'react'
import { AppProvider } from './AppContext'
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
  { hash: '#/today', label: 'Today', match: ['today'] },
  { hash: '#/journal', label: 'Journal', match: ['journal', 'entry'] },
  { hash: '#/library', label: 'Library', match: ['library', 'card'] },
  { hash: '#/spread', label: 'Spread', match: ['spread'] },
  { hash: '#/settings', label: 'Settings', match: ['settings'] },
]

function View({ route }: { route: Route }) {
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
        Skip to content
      </a>
      <header className="masthead">
        <a href="#/today" className="wordmark">
          Understory
        </a>
      </header>
      <main id="main" className="main">
        <View route={route} />
      </main>
      <nav className="tabbar" aria-label="Main">
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
