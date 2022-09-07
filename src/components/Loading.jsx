import styles from '~/styles/pages/Loading.module.scss';
import { Html } from '@react-three/drei';

export const Loading = () => {
  return (
    <Html fullscreen>
      <div className={styles.root}>
        <p className={styles.text}>Loading...</p>
      </div>
    </Html>
  );
};
