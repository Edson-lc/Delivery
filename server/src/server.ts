import app from './app';
import { env } from './env';

const port = env.PORT || 4000;

app.listen(port, '0.0.0.0', () => {
  console.log(`AmaEats API running on http://localhost:${port}`);
  console.log(`AmaEats API accessible on network at http://192.168.1.229:${port}`);
});
