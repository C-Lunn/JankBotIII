// import prism from 'prism-media';
// import { pipeline } from 'stream';
// import ytdlp from 'youtube-dl-exec';
// import ytdl from 'ytdl-core';

// function filter(format: any) {
// 	return format.codecs === 'opus' &&
// 		format.container === 'webm' &&
// 		format.audioSampleRate == 48000;
// }

// /**
//  * Tries to find the highest bitrate audio-only format. Failing that, will use any available audio format.
//  * @private
//  * @param {Object[]} formats The formats to select from
//  * @param {boolean} isLive Whether the content is live or not
//  */
// function nextBestFormat(formats: any[], isLive: boolean) {
// 	let filter = (format: any) => format.audioBitrate;
// 	if (isLive) filter = format => format.audioBitrate && format.isHLS;
// 	formats = formats
// 		.filter(filter)
// 		.sort((a, b) => b.audioBitrate - a.audioBitrate);
// 	return formats.find(format => !format.bitrate) || formats[0];
// }

// const noop = () => {};

// async function download(url: string, options = {}) {
// 	const info = await ytdl.getInfo(url);
// 	// Prefer opus
// 	const format = info.formats.find(filter);
// 	const canDemux = format && info.videoDetails.lengthSeconds != "0";
// 	if (canDemux) options = { ...options, filter };
// 	else if (info.videoDetails.lengthSeconds != "0") options = { ...options, filter: 'audioonly' };
// 	if (canDemux) {
// 		const demuxer = new prism.opus.WebmDemuxer();
//         // .pipe(demuxer);

// 		return pipeline([
//             ytdlp.exec(url, {
//                 format: 'bestaudio/best',
//                 output: '-',
//             }, { stdio: ['ignore', 'pipe', 'ignore'] }).stdout!,
// 			demuxer
// 		], noop);
// 	} else {
// 		const bestFormat = nextBestFormat(info.formats, false);
// 		if (!bestFormat) throw new Error('No suitable format found');
// 		const transcoder = new prism.FFmpeg({
// 			args: [
// 				'-reconnect', '1',
// 				'-reconnect_streamed', '1',
// 				'-reconnect_delay_max', '5',
// 				'-i', bestFormat.url,
// 				'-analyzeduration', '0',
// 				'-loglevel', '0',
// 				'-f', 's16le',
// 				'-ar', '48000',
// 				'-ac', '2',
// 			],
// 			shell: false,
// 		});
// 		const opus = new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 });
// 		return pipeline([transcoder, opus], noop);
// 	}
// }

// const ytdld =  Object.assign(download, ytdl);

// export default ytdld;