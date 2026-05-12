import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import Index from "./pages/index";
import LoginPage from "./pages/login";
import DashboardPage from "./pages/dashboard";
import NewCasePage from "./pages/new-case";
import EditCasePage from "./pages/edit-case";
import CasePage from "./pages/case";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/login" component={LoginPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/dashboard/new" component={NewCasePage} />
        <Route path="/dashboard/case/:id" component={EditCasePage} />
        <Route path="/case/:id" component={CasePage} />
      </Switch>
      {import.meta.env.DEV && <AgentFeedback />}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
