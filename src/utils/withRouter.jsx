import { useNavigate, useLocation, useParams } from 'react-router-dom'

/**
 * Higher Order Component to provide router props to class components
 * Allows class components to use React Router navigation
 */
export function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    const navigate = useNavigate()
    const location = useLocation()
    const params = useParams()
    
    return (
      <Component
        {...props}
        navigate={navigate}
        location={location}
        params={params}
      />
    )
  }

  return ComponentWithRouterProp
}
