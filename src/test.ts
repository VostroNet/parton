import bcrypt from 'bcrypt';

(async () => {
  const salt = await bcrypt.genSalt(5, 'a');
  const hash = await bcrypt.hash('test', salt);
  console.log(hash);
  console.log(await bcrypt.compare('test', hash));
})();
