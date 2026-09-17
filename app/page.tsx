import StudyApp from './study-app';
import {env} from 'cloudflare:workers';
export default function Home() { return <StudyApp standalone={env.PRIVATE_DEPLOYMENT==='1'} />; }

