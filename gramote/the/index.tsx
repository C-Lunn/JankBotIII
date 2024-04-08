import { render } from 'preact';
import "@fontsource-variable/cabin";
import "@fontsource/hammersmith-one";
import { $songs, $thread } from './stores';
import Client from "./client";

const client = new Client();

const App = () => {
    return <>
        <h1>{$thread.value?.title}</h1>
        <p>{$songs}</p>
    </>
};

render(<App />, document.body);

//@ts-ignore
if (module.hot) {
    //@ts-ignore
    module.hot.accept();
}