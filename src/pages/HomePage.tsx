import { Component, For, JSX } from "solid-js";

import Text from "../components/Text";
import LogoType from "../components/LogoType";
import Box from "../components/Box";

import "./pages.css";
import FlexDivider from "../components/FlexDivider";
import ExperimentCard from "../components/ExperimentCard";
import { EXPERIMENTS_LIST } from "../constants";
import { useNavigate } from "@solidjs/router";

const HomePage: Component = () => {
  const navigate = useNavigate();
  return (
    <div class="pageContainer">
      {/* Header bar */}
      <div class="pageRowContainer">
        <Box>
          <LogoType />
        </Box>
        <Box
          style={{
            flex: 1,
            display: "flex",
            "flex-direction": "row",
            "justify-content": "space-evenly",
            "align-items": "center",
            gap: "0.25rem",
          }}
        >
          <Text
            class="clickable heading-1"
            value="About"
            onClick={() => navigate("/about")}
          />
          <FlexDivider />
          <Text class="clickable disabled heading-1" value="Random" />
          <FlexDivider />
          <Text class="clickable disabled heading-1" value="Search" />
        </Box>
      </div>
      {/* Content */}
      <div class="homePageContentContainer">
        <For each={EXPERIMENTS_LIST}>
          {(item) => <ExperimentCard {...item} />}
        </For>
        {/* dummy card to show users that it is a list */}
        <div class="box-0 experimentCard dummyCard">
          <Text
            class="heading-3"
            value="Coming Soon..."
            style={{ position: "relative", left: "0.5rem" }}
          />
          <a class="note clickable" href="mailto:info@lostpixels.org">
            Want to help out?
          </a>
        </div>
      </div>

      <div class="shadow-0-z1" style={{position: "fixed", bottom: "0.25rem", right: "0.25rem"}}>
      <iframe src='https://thebutton.lostpixels.org/embed' style='border-width:0px;width: 224px;height: 120px;'></iframe>
      </div>
    </div>
  );
};

export default HomePage;
