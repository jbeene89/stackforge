import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { CascadeVideo } from "./CascadeVideo";

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
  </>
);
