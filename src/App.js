import './App.css';
import tw from 'twin.macro';
import TopSection from './containers/TopSection/TopSection';
import AboutMeSection from './containers/AboutMeSection/AboutMeSection';
import ProjectsSection from "./containers/ProjectsSection/ProjectsSection"
import ContactMeSection from './containers/ContactMeSection/ContactMeSection';
import CustomCursor from './components/CustomCursor';
import { useMediaQuery } from 'react-responsive';
import { deviceSize } from './components/responsive';

const AppContainer = tw.div`w-full h-full font-family['Encode Sans Expanded']`;

function App() {

  const isTablet = useMediaQuery({ maxWidth: deviceSize.tablet });

  return (
    <AppContainer>
      {!isTablet && <CustomCursor/>}
      <TopSection isTablet={isTablet}/>
      <AboutMeSection/>
      <ProjectsSection/>
      <ContactMeSection/>
    </AppContainer>
  );
}

export default App;
