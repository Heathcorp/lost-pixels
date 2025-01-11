import { Component } from "solid-js";
import { Router, Routes, Route } from "@solidjs/router";

import "./fonts.css";
import "./index.css";

import HomePage from "./pages/HomePage";
import ExperimentPage from "./pages/ExperimentPage";

import { EXPERIMENTS_LIST } from "./constants";
import AboutPage from "./pages/AboutPage";

const App: Component = () => {
  return (
    <Router>
      <Routes>
        <Route path={["/", "/*"]} component={HomePage} />
        <Route path="/about" component={AboutPage} />
        <Route
          path="/experiment/:experimentId?"
          component={ExperimentPage}
          data={({ params }) =>
            EXPERIMENTS_LIST.find((e) => e.id === params.experimentId)
          }
        />
        {/* <Route path="/home"/> */}
      </Routes>
    </Router>
  );
};

export default App;
