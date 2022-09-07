import Head from 'next/head';
import styles from '~/styles/pages/PageIndex.module.scss';
import { WebGLCanvas } from '~/components/WebGLCanvas';

export default function Index() {
  return (
    <div className={styles.root}>
      <Head>
        <title>fireworks2022</title>
        <meta
          name="description"
          content="a Fireworks demo created using Three.js"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1 className={styles.title}>Fireworks 2022 by bokoko33</h1>
      <WebGLCanvas />
    </div>
  );
}
