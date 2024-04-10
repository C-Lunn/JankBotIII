import { render } from 'preact';
import "@fontsource-variable/cabin";
import "@fontsource/hammersmith-one";
import { $songs } from './state';
import { ShowHeader } from './bits';
import { client as _ } from "./state";

const App = () => {
    return <>
        <ShowHeader />
        <p>{$songs}</p>
    </>
};

render(<App />, document.body);

//@ts-ignore
if (module.hot) {
    //@ts-ignore
    module.hot.accept();
}