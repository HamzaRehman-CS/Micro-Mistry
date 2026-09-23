import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Landing({ onStart, onViewLeaderboard }) {
  const [name, setName] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [number, setNumber] = useState('');
  const valid = name.trim() && universityId.trim() && number.trim();
  const submit = (event) => {
    event.preventDefault();
    if (valid) onStart({ name: name.trim(), universityId: universityId.trim(), number: number.trim() });
  };
  return <main className="micro-landing">
    <motion.section className="micro-intro" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <p className="micro-kicker">SCIENCE FESTA PRESENTS / THE TINY STUFF EDITION</p>
      <div className="micro-hero-art" aria-hidden="true"><span className="micro-orbit orbit-one"/><span className="micro-orbit orbit-two"/><span className="micro-specimen">?</span><span className="micro-art-note">1000×<br/>WEIRDER</span><span className="micro-spark spark-one">✳</span><span className="micro-spark spark-two">✷</span></div>
      <h1 className="title-display">MICRO<span>MYSTERY!</span></h1>
      <p className="micro-lede">Five zoomed-in things. Thirty seconds each. Your eyeballs are now the detective.</p>
      <div className="micro-facts"><span><strong>05</strong> tiny suspects</span><span><strong>30s</strong> to guess</span><span><strong>03</strong> rescue buttons</span></div>
    </motion.section>
    <motion.form className="micro-registration" onSubmit={submit} initial={{ rotate: 2, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ delay: .12 }}>
      <div className="micro-form-heading"><span>CASE FILE 001</span><h2>Who’s on the case?</h2><p>Sign in, then put the microscopic world on trial.</p></div>
      <div className="micro-fields">
        <div className="micro-field"><label htmlFor="mm-name">Full name</label><input id="mm-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your detective name" required/></div>
        <div className="micro-field"><label htmlFor="mm-id">University ID</label><input id="mm-id" autoComplete="off" value={universityId} onChange={(e) => setUniversityId(e.target.value)} placeholder="Your university ID" required/></div>
        <div className="micro-field"><label htmlFor="mm-phone">Phone number</label><input id="mm-phone" autoComplete="tel" type="tel" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Your phone number" required/></div>
      </div>
      <button className="btn btn-primary w-full micro-start" disabled={!valid}>LET’S GET SUSPICIOUS <span aria-hidden="true">↗</span></button>
      <button className="btn w-full micro-board-link" type="button" onClick={onViewLeaderboard}>PEEK AT THE LEADERBOARD</button>
      <p className="micro-privacy">Completed attempts are recorded for the event. Your phone number stays off the public leaderboard.</p>
    </motion.form>
  </main>;
}
