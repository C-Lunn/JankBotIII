import { $thread } from "./state";

export const ShowHeader = () => <header class="site-header">
    <h1>{$thread.value.title}</h1>
    <button>Finish Show</button>
</header>