import { Component } from 'solid-js';
import Box from '../components/Box';
import LogoType from '../components/LogoType';
import { useNavigate } from '@solidjs/router';

import Text from '../components/Text';

const AboutPage: Component = (props) => {
  const navigate = useNavigate();
  return (
    <div class="pageContainer">
      <div class="pageRowContainer" style={{ 'justify-content': 'center' }}>
        <Box>
          <LogoType class="clickable" onClick={() => navigate('/home')} />
        </Box>
      </div>
      <div class="aboutPageContentContainer">
        <Box class="box-1" style={{ padding: '5rem' }}>
          <Text>
            {/* TODO: move to constants */}
            Lost Pixels (.org) is a website intended to bring the old web back
            to life.
            <br />
            <br />
            Think of this as a digital, online art gallery, where the art pieces
            are web-enabled experiments. The experiments hosted on this site are
            intended (although not strictly) to be collaborative in nature and
            anonymous, providing the sense of disconnected community that the
            old web provided.
            <br />
            <br />
            What is "the old web"?
            <br />
            In a past time, you could acquire digital media for a fixed price,
            not having to download anything extra, pay for extra features, or
            subscribe to any plans to fully enjoy it.
            <br />
            <br />
            Many of today's digital goods are in fact not goods, but services.
            In the case of game development companies: the majority of profit
            comes from the addition of features over the lifetime of the
            product, rather than the initial (often free) cost.
            <br />
            <br />
            That feeling of putting a game cartridge into a console and simply
            playing it - no logins or paid extras - is what I want to bring back
            with lostpixels.org.
            <br />
            <br />I am not trying to say that the profit model for many modern
            content-production entities is inherently wrong (although it can
            lead to things like gambling-addictions among youth), I am simply
            trying to create my own interpretation of an "old web"-site, and
            hopefully bring some people a little bit of joy, despite the noise
            of addictive applications out there.
            <br />
            <br />
            The web is a casino with the world's smartest engineers tasked with
            winning your hard-earned time at the blackjack table.
            <br />
            <br />
            So, would you rather gamble your time at a casino, or spend your
            time at a friend's place, playing Halo split-screen on an XBOX? The
            choice is yours.
            <br />
            <br />
            <Text class="clickable">
              <a href="mailto:info@lostpixels.org" class="body clickable">
                info@lostpixels.org
              </a>
            </Text>
          </Text>
        </Box>
      </div>
    </div>
  );
};

export default AboutPage;
