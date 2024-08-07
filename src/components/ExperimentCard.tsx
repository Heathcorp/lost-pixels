import { Component, JSX, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";

import Text from "../components/Text";
import Box from "../components/Box";

import "../pages/pages.css";

const ExperimentCard: Component<{
  id: string;
  name: string;
  caption: string;
  url: string;
  image_path: string;
}> = (props) => {
  const navigate = useNavigate();

  return (
    <Box
      class="button-0 experimentCard"
      onClick={() => navigate(`experiment/${props.id}`)}
    >
      {/* Title */}
      <Text value={props.name} class="heading-1" />
      {/* Thumbnail */}
      <Box class="box-1 no-shadow square" style={{ padding: "0px" }}>
        <img src={props.image_path} class="image-default" />
      </Box>
      {/* Buttons? */}
      {/* Description */}
      <Text>{props.caption}</Text>
    </Box>
  );
};

export default ExperimentCard;
