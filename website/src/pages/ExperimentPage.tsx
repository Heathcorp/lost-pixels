import { Component } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';

const ExperimentPage: Component = (props) => {
  const params = useParams<{ experimentId: string }>();
  const navigate = useNavigate();

  if (!params.experimentId) navigate('/home');

  return <>hello</>;
};

export default ExperimentPage;
