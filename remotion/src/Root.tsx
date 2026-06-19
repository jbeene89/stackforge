import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { CascadeVideo } from "./CascadeVideo";
import { HighlightsVideo } from "./HighlightsVideo";
import { MobileAdVideo } from "./MobileAdVideo";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={450}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="cascade"
      component={CascadeVideo}
      durationInFrames={420}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="highlights"
      component={HighlightsVideo}
      durationInFrames={525}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="mobile-ad"
      component={MobileAdVideo}
      durationInFrames={720}
      fps={30}
      width={1080}
      height={1080}
    />
    <Composition
      id="mobile-ad-vertical"
      component={MobileAdVideo}
      durationInFrames={720}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
