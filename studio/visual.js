import { getLocale, tr, translateError } from './i18n.js';
const $ = (selector) => document.querySelector(selector);
const normalize = (value) =>
  String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .trim();

export function initVisualStudio({ api, getState, refresh, toast }) {
  let mode = null,
    stream = null,
    timer = null,
    pending = null,
    sessionId = null,
    clickTimer = null,
    lastClickCount = 0;
  let frames = getState().visualRecordings?.[0]?.frames ?? [];
  let recordingId = getState().visualRecordings?.[0]?.id ?? null;
  let guide = getState().visualSkills?.[0]?.skill ?? null;
  let guideRecordingId = getState().visualSkills?.[0]?.recordingId ?? null;
  let followIndex = 0,
    lastPixels = null,
    lastSent = 0;
  let lastStatus = { key: 'visualNoScreen', params: {} };
  let lastClickStatus = null;
  let lastFollow = {};
  const labels = new Map(),
    selected = new Set(frames.map((f) => f.index));
  const video = $('#visual-preview');
  const sample = document.createElement('canvas');
  sample.width = 96;
  sample.height = 54;
  const sampleContext = sample.getContext('2d', { willReadFrequently: true });
  const imageCanvas = document.createElement('canvas');
  const canShare = typeof navigator.mediaDevices?.getDisplayMedia === 'function';

  function status(key, params = {}) {
    lastStatus = { key, params };
    $('#visual-status').textContent = tr(key, params);
  }
  function clickStatus(key, params = {}) {
    lastClickStatus = { key, params };
    $('#visual-click-status').textContent = tr(key, params);
  }
  function clickDescription(click) {
    return tr('visualClickAt', {
      button: tr(click.button === 'right' ? 'visualClickRight' : 'visualClickLeft'),
      x: Math.round(click.x * 100),
      y: Math.round(click.y * 100),
    });
  }
  function showClickCapture(capture, count = 0) {
    const key = capture?.enabled
      ? 'visualClicksReady'
      : ({
          'full-screen-required': 'visualClicksFullScreen',
          permission: 'visualClicksPermission',
          'multiple-displays': 'visualClicksMultipleDisplays',
          limit: 'visualClicksLimit',
          'time-limit': 'visualClicksTimeLimit',
          'tap-ended': 'visualClicksEnded',
          'not-requested': 'visualClicksOff',
        }[capture?.reason] ?? 'visualClicksUnavailable');
    clickStatus(key, { count });
  }
  async function pollClicks() {
    if (mode !== 'record' || !sessionId) return;
    try {
      const result = await api('/api/teach/visual/clicks', { id: sessionId });
      showClickCapture(result.clickCapture, result.clicks.length);
      if (result.clicks.length > lastClickCount) {
        lastClickCount = result.clicks.length;
        setTimeout(() => capture(true), 350);
      }
    } catch {}
  }
  function buttons() {
    $('#visual-start').disabled = !!mode || !canShare;
    $('#visual-stop').disabled = mode !== 'record';
    $('#visual-recover').hidden = !!mode || !getState().visualSession;
    $('#visual-compile').disabled = !!mode || frames.length < 2;
    $('#visual-download').disabled = !guide;
    $('#visual-follow').disabled = !!mode || !guide || !canShare;
    $('#visual-follow-stop').disabled = mode !== 'follow';
    $('#visual-next').disabled = mode !== 'follow' || followIndex >= (guide?.steps.length ?? 0);
    $('#visual-capture-clicks').disabled = !!mode;
  }
  function saveDraft() {
    for (const row of document.querySelectorAll('.visual-frame')) {
      const index = Number(row.dataset.index);
      if (row.querySelector('input[type="checkbox"]')?.checked) selected.add(index);
      else selected.delete(index);
      labels.set(index, row.querySelector('input[type="text"]')?.value ?? '');
    }
  }
  function renderFrames() {
    saveDraft();
    const container = $('#visual-frames');
    container.replaceChildren();
    if (!frames.length) {
      const note = document.createElement('p');
      note.className = 'muted';
      note.textContent = tr('visualNoFrames');
      container.append(note);
      buttons();
      return;
    }
    for (const frame of frames) {
      const row = document.createElement('div');
      row.className = 'visual-frame';
      row.dataset.index = frame.index;
      const image = document.createElement('img');
      image.loading = 'lazy';
      image.alt = tr('visualImageAlt', { number: frame.index + 1 });
      image.src = `/api/teach/visual/image?id=${encodeURIComponent(recordingId ?? sessionId)}&frame=${frame.index}&token=${getState().token}`;
      const preview = document.createElement('div');
      preview.className = 'frame-preview';
      preview.append(image);
      for (const click of (frame.clicks ?? []).slice(0, 10)) {
        const marker = document.createElement('span');
        marker.className = 'click-marker';
        marker.style.left = `${click.x * 100}%`;
        marker.style.top = `${click.y * 100}%`;
        marker.title = clickDescription(click);
        preview.append(marker);
      }
      const detail = document.createElement('div'),
        label = document.createElement('label'),
        checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selected.has(frame.index);
      label.append(
        checkbox,
        document.createTextNode(
          ` ${tr('visualFrame', { number: frame.index + 1, seconds: (frame.atMs / 1000).toFixed(1) })}`,
        ),
      );
      const text = document.createElement('small');
      text.textContent =
        frame.ocr
          .map((r) => r.text)
          .slice(0, 8)
          .join(' · ') || tr('visualNoText');
      const instruction = document.createElement('input');
      instruction.type = 'text';
      instruction.maxLength = 200;
      instruction.placeholder = tr('visualActionPlaceholder');
      instruction.value = labels.get(frame.index) ?? '';
      detail.append(label, text, instruction);
      if (frame.clicks?.length) {
        const clicks = document.createElement('small');
        clicks.className = 'click-evidence';
        clicks.textContent = `${tr('visualClickSummary', { count: frame.clicks.length })} ${frame.clicks
          .slice(0, 3)
          .map(clickDescription)
          .join(' · ')}`;
        detail.append(clicks);
      }
      row.append(preview, detail);
      container.append(row);
    }
    buttons();
  }
  function renderFollow(info = lastFollow) {
    lastFollow = info;
    const target = $('#visual-follow-status');
    target.replaceChildren();
    const div = document.createElement('div');
    div.className = followIndex >= (guide?.steps.length ?? 0) ? 'success' : 'muted';
    const step = guide?.steps[followIndex];
    const instruction = step?.instructionTranslations?.[getLocale()] ?? step?.instruction;
    div.textContent = info.created
      ? tr('visualGuideCreated', { count: guide.steps.length })
      : !guide
        ? tr('visualCreateFirst')
        : followIndex >= guide.steps.length
          ? tr('visualGuideDone', { count: guide.steps.length })
          : info.found !== undefined
            ? tr('visualStepProgress', {
                number: followIndex + 1,
                total: guide.steps.length,
                instruction,
                found: info.found,
                totalMarkers: info.totalMarkers,
              })
            : tr('visualStep', {
                number: followIndex + 1,
                total: guide.steps.length,
                instruction,
                markers: step.markers.join(' ; ') || tr('visualManual'),
              });
    target.append(div);
    const recordingAvailable = getState().visualRecordings?.some(
      (recording) => recording.id === guideRecordingId,
    );
    if (step && recordingAvailable) {
      const referenceStep = followIndex > 0 ? guide.steps[followIndex - 1] : step;
      const figure = document.createElement('figure');
      figure.className = 'follow-reference';
      const preview = document.createElement('div');
      preview.className = 'follow-reference-preview';
      const image = document.createElement('img');
      image.loading = 'lazy';
      image.alt = tr('visualReferenceAlt', { number: referenceStep.frameIndex + 1 });
      image.src = `/api/teach/visual/image?id=${encodeURIComponent(guideRecordingId)}&frame=${referenceStep.frameIndex}&token=${getState().token}`;
      preview.append(image);
      for (const click of (followIndex > 0 ? (step.interactions ?? []) : []).slice(0, 10)) {
        const marker = document.createElement('span');
        marker.className = 'click-marker';
        marker.style.left = `${click.x * 100}%`;
        marker.style.top = `${click.y * 100}%`;
        marker.setAttribute('aria-hidden', 'true');
        preview.append(marker);
      }
      const caption = document.createElement('figcaption');
      caption.textContent = tr(
        followIndex > 0 && step.interactions?.length
          ? 'visualReferenceWithClicks'
          : 'visualReferenceScreen',
      );
      figure.append(preview, caption);
      target.append(figure);
    }
    if (step?.interactions?.length) {
      const clicks = document.createElement('p');
      clicks.className = 'click-evidence';
      clicks.textContent = `${tr('visualClickSummary', { count: step.interactions.length })} ${step.interactions
        .slice(0, 3)
        .map(clickDescription)
        .join(' · ')}`;
      target.append(clicks);
    }
    buttons();
  }
  function changed() {
    sampleContext.drawImage(video, 0, 0, 96, 54);
    const now = sampleContext.getImageData(0, 0, 96, 54).data;
    if (!lastPixels) {
      lastPixels = now;
      return true;
    }
    let count = 0;
    for (let i = 0; i < now.length; i += 4)
      if (
        Math.abs(now[i] - lastPixels[i]) +
          Math.abs(now[i + 1] - lastPixels[i + 1]) +
          Math.abs(now[i + 2] - lastPixels[i + 2]) >
        65
      )
        count++;
    lastPixels = now;
    return count / (96 * 54) > 0.008 || Date.now() - lastSent > 8000;
  }
  function image() {
    const width = Math.min(video.videoWidth, 1600);
    imageCanvas.width = width;
    imageCanvas.height = Math.round((width * video.videoHeight) / video.videoWidth);
    imageCanvas.getContext('2d').drawImage(video, 0, 0, imageCanvas.width, imageCanvas.height);
    return imageCanvas.toDataURL('image/jpeg', 0.72);
  }
  async function capture(force = false) {
    if (!mode || pending || video.readyState < 2 || !video.videoWidth) return;
    const hasChanged = changed();
    if (!force && !hasChanged) return;
    const frame = image();
    lastSent = Date.now();
    pending = (async () => {
      if (mode === 'record') {
        const result = await api('/api/teach/visual/frame', {
          id: sessionId,
          image: frame,
          locale: getLocale(),
        });
        frames.push(result);
        selected.add(result.index);
        renderFrames();
        status('visualCaptured', { count: frames.length });
        if (frames.length >= 120)
          setTimeout(() => stop().catch((error) => toast(error.message)), 0);
      } else if (mode === 'follow' && guide && followIndex < guide.steps.length) {
        const result = await api('/api/teach/visual/observe', {
          image: frame,
          locale: getLocale(),
        });
        const markers = guide.steps[followIndex].markers.map(normalize).filter(Boolean);
        const seen = result.ocr.map((r) => normalize(r.text));
        const count = markers.filter((m) =>
          seen.some((line) => line === m || line.includes(m)),
        ).length;
        if (markers.length && count / markers.length >= 0.7) {
          followIndex++;
          renderFollow({});
        } else renderFollow({ found: count, totalMarkers: markers.length });
      }
    })();
    try {
      await pending;
    } catch (error) {
      toast(translateError(error));
      status('visualReadFailed', { error: translateError(error) });
    } finally {
      pending = null;
    }
  }
  async function share(nextMode) {
    if (!navigator.mediaDevices?.getDisplayMedia) throw Error(tr('visualUnsupported'));
    const selectedStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 5 },
      audio: false,
    });
    stream = selectedStream;
    video.srcObject = stream;
    await video.play();
    if (!video.videoWidth)
      await new Promise((resolve) =>
        video.addEventListener('loadedmetadata', resolve, { once: true }),
      );
    mode = nextMode;
    lastPixels = null;
    lastSent = 0;
    stream.getVideoTracks()[0].addEventListener(
      'ended',
      () => {
        if (mode) stop().catch((e) => toast(e.message));
      },
      { once: true },
    );
    timer = setInterval(() => capture(), 1800);
    buttons();
  }
  async function stop() {
    if (!mode) return;
    const was = mode;
    mode = null;
    clearInterval(timer);
    timer = null;
    clearInterval(clickTimer);
    clickTimer = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
    if (pending) await pending.catch(() => {});
    if (was === 'record' && sessionId) {
      const result = await api('/api/teach/visual/stop', { id: sessionId });
      recordingId = result.id;
      frames = result.frames;
      showClickCapture(result.clickCapture, result.clicks?.length ?? 0);
      sessionId = null;
      await refresh();
      renderFrames();
      status('visualStopped', { count: frames.length });
    } else status('visualFollowStopped');
    buttons();
  }
  async function run(button, fn) {
    button.disabled = true;
    try {
      await fn();
    } catch (error) {
      toast(translateError(error));
      status('visualReadFailed', { error: translateError(error) });
    } finally {
      buttons();
    }
  }
  $('#visual-start').addEventListener('click', (event) =>
    run(event.currentTarget, async () => {
      await share('record');
      try {
        const result = await api('/api/teach/visual/start', {
          captureClicks: $('#visual-capture-clicks').checked,
          displaySurface: stream.getVideoTracks()[0].getSettings().displaySurface,
        });
        sessionId = result.id;
        if (mode !== 'record') {
          await api('/api/teach/visual/stop', { id: sessionId });
          sessionId = null;
          return;
        }
        lastClickCount = 0;
        showClickCapture(result.clickCapture, 0);
        if (result.clickCapture.enabled) clickTimer = setInterval(pollClicks, 1200);
        recordingId = null;
        frames = [];
        $('#visual-frames').replaceChildren();
        selected.clear();
        labels.clear();
        renderFrames();
        status('visualRecording');
        await capture();
      } catch (error) {
        mode = null;
        clearInterval(timer);
        clearInterval(clickTimer);
        clickTimer = null;
        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        video.srcObject = null;
        throw error;
      }
    }),
  );
  $('#visual-stop').addEventListener('click', (event) => run(event.currentTarget, stop));
  $('#visual-recover').addEventListener('click', (event) =>
    run(event.currentTarget, async () => {
      const id = getState().visualSession?.id;
      if (!id) return;
      const result = await api('/api/teach/visual/stop', { id });
      recordingId = result.id;
      frames = result.frames;
      showClickCapture(result.clickCapture, result.clicks?.length ?? 0);
      sessionId = null;
      await refresh();
      renderFrames();
      status('visualRecovered', { count: frames.length });
    }),
  );
  $('#visual-compile').addEventListener('click', (event) =>
    run(event.currentTarget, async () => {
      saveDraft();
      const picks = frames.filter((f) => selected.has(f.index)).map((f) => f.index);
      const result = await api('/api/teach/visual/compile', {
        id: recordingId,
        title: $('#visual-title').value,
        locale: getLocale(),
        selected: picks,
        labels: Object.fromEntries(labels),
      });
      guide = result.skill;
      guideRecordingId = result.recordingId;
      await refresh();
      renderFollow({ created: true });
      toast({ i18nKey: 'visualGuideToast' });
    }),
  );
  $('#visual-download').addEventListener('click', () => {
    if (!guide) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(guide, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teachpack-guide-visuel.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('#visual-follow').addEventListener('click', (event) =>
    run(event.currentTarget, async () => {
      followIndex = 0;
      await share('follow');
      renderFollow({});
      status('visualFollowing');
      await capture();
    }),
  );
  $('#visual-follow-stop').addEventListener('click', (event) => run(event.currentTarget, stop));
  $('#visual-next').addEventListener('click', () => {
    if (mode === 'follow' && guide && followIndex < guide.steps.length) {
      followIndex++;
      renderFollow({});
    }
  });
  renderFrames();
  renderFollow();
  if (getState().visualRecordings?.[0]?.clickCapture)
    showClickCapture(
      getState().visualRecordings[0].clickCapture,
      getState().visualRecordings[0].clicks?.length ?? 0,
    );
  if (!canShare) status('visualUnsupported');
  document.addEventListener('frontier:localechange', () => {
    renderFrames();
    renderFollow();
    status(lastStatus.key, lastStatus.params);
    if (lastClickStatus) clickStatus(lastClickStatus.key, lastClickStatus.params);
  });
}
