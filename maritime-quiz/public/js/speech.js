/* 英语听力：优先 Web Speech API 离线/在线朗读；不支持时提示查看原文 */
(function (global) {
  'use strict';

  const supported = 'speechSynthesis' in global;

  function pickVoice(lang) {
    const voices = global.speechSynthesis.getVoices();
    if (!voices.length) return null;
    return (
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => v.lang.startsWith(lang.slice(0, 2))) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null
    );
  }

  function speak(text, lang, { onStart, onEnd, onError } = {}) {
    if (!supported) {
      onError && onError(new Error('unsupported'));
      return () => {};
    }
    global.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || 'en-US';
    u.rate = 0.92;
    u.pitch = 1;
    const v = pickVoice(u.lang);
    if (v) u.voice = v;
    u.onstart = () => onStart && onStart();
    u.onend = () => onEnd && onEnd();
    u.onerror = (e) => onError && onError(e);
    global.speechSynthesis.speak(u);
    return () => global.speechSynthesis.cancel();
  }

  function stop() {
    if (supported) global.speechSynthesis.cancel();
  }

  global.Speaker = { supported, speak, stop };
})(window);
