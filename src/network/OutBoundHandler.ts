import {BatchPool, BinaryWriter, PacketPool} from "../utils";
import {ProtocolId} from "./Protocol";
import {MinecraftClient} from "../MinecraftClient";
import {util} from "node-jose";
import {byte, int} from "../types";
import {PlayerLocation} from "../math";
import {EventType} from "../event";
import Long = require("long");
import base64url = util.base64url;
import {LoginCredentials} from "../data";

/**
 * Anything relevant to sending data to the server
 *
 * Functionality/purpose should be implemented by subclasses
 */
export class OutBoundHandler {

    private readonly client: MinecraftClient;
    private readonly _batchPool: BatchPool;

    constructor(client: MinecraftClient) {

        this.client = client;
        this._batchPool = new BatchPool(this.client);
    }


    public sendLogin(): void {

        // I won't implement encryption for now because Nukkit doesn't verify the signature, so we can
        // technically fake the token. However, node-jose is still included for anyone who wants to
        // properly implement it. Minecraft uses ES384, which should be supported by node-jose.

        // JWK.createKey("oct", 256, {alg: "ES384"}).then(function (result) {
        //     // {result} is a jose.JWK.Key
        //     // {result.keystore} is a unique jose.JWK.KeyStore
        //     console.log(result);
        //     console.log(result.keystore);
        // });


        let credentials: LoginCredentials = {

            // these are randomly generated data

            uuid: '09b6c89c-428c-4ef3-a0c0-51562d9d373a',
            xuid: '2d9d373a',
            displayName: 'WebPE测试',
            cid: -3911347568285239894,      // ClientRandomId

        };

        this.client.emit(EventType.PlayerLoginRequest, credentials);


        let token = `{"extraData":{"XUID":"${credentials.xuid}","identity":"${credentials.uuid}","displayName":"${credentials.displayName}"}}`;
        let chainData = '{"chain":["header.' + base64url.encode(token) + '.verify"]}';

        let skinData = 'header.' + base64url.encode(
            '{' +
            '"CapeData":"",' +
            `"ClientRandomId":${credentials.cid},` +
            '"CurrentInputMode":2,' +
            '"DefaultInputMode":2,' +
            '"DeviceModel":"iPhone8,1",' +
            '"DeviceOS":2,' +
            '"GameVersion":"1.11.4",' +
            '"GuiScale":0,' +
            '"LanguageCode":"zh_CN",' +
            '"ServerAddress":"0.0.0.0:19132",' +
            '"SkinData":"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ll9B/5ZfQf+WX0H/lm9b/6p9Zv+Wb1v/lm9b/4dVO/+WX0H/ll9B/5ZfQf+qfWb/lm9b/6p9Zv+Wb1v/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABWScz/VknM/1ZJzP9WScz/KCgo/ygoKP8oKCj/KCgo/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKio/wDMzP8AzMz/AKio/1ExJf9qQDD/UTEl/2pAMP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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",' +
            '"SkinGeometry":"ew0KICAiZ2VvbWV0cnkuaHVtYW5vaWQiOiB7DQogICAgImJvbmVzIjogWw0KICAgICAgew0KICAgICAgICAibmFtZSI6ICJib2R5IiwNCiAgICAgICAgInBpdm90IjogWyAwLjAsIDI0LjAsIDAuMCBdLA0KICAgICAgICAiY3ViZXMiOiBbDQogICAgICAgICAgew0KICAgICAgICAgICAgIm9yaWdpbiI6IFsgLTQuMCwgMTIuMCwgLTIuMCBdLA0KICAgICAgICAgICAgInNpemUiOiBbIDgsIDEyLCA0IF0sDQogICAgICAgICAgICAidXYiOiBbIDE2LCAxNiBdDQogICAgICAgICAgfQ0KICAgICAgICBdDQogICAgICB9LA0KDQogICAgICB7DQogICAgICAgICJuYW1lIjogIndhaXN0IiwNCiAgICAgICAgIm5ldmVyUmVuZGVyIjogdHJ1ZSwNCiAgICAgICAgInBpdm90IjogWyAwLjAsIDEyLjAsIDAuMCBdDQogICAgICB9LA0KDQogICAgICB7DQogICAgICAgICJuYW1lIjogImhlYWQiLA0KICAgICAgICAicGl2b3QiOiBbIDAuMCwgMjQuMCwgMC4wIF0sDQogICAgICAgICJjdWJlcyI6IFsNCiAgICAgICAgICB7DQogICAgICAgICAgICAib3JpZ2luIjogWyAtNC4wLCAyNC4wLCAtNC4wIF0sDQogICAgICAgICAgICAic2l6ZSI6IFsgOCwgOCwgOCBdLA0KICAgICAgICAgICAgInV2IjogWyAwLCAwIF0NCiAgICAgICAgICB9DQogICAgICAgIF0NCiAgICAgIH0sDQoNCiAgICAgIHsNCiAgICAgICAgIm5hbWUiOiAiaGF0IiwNCiAgICAgICAgInBpdm90IjogWyAwLjAsIDI0LjAsIDAuMCBdLA0KICAgICAgICAiY3ViZXMiOiBbDQogICAgICAgICAgew0KICAgICAgICAgICAgIm9yaWdpbiI6IFsgLTQuMCwgMjQuMCwgLTQuMCBdLA0KICAgICAgICAgICAgInNpemUiOiBbIDgsIDgsIDggXSwNCiAgICAgICAgICAgICJ1diI6IFsgMzIsIDAgXSwNCiAgICAgICAgICAgICJpbmZsYXRlIjogMC41DQogICAgICAgICAgfQ0KICAgICAgICBdLA0KICAgICAgICAibmV2ZXJSZW5kZXIiOiB0cnVlDQogICAgICB9LA0KDQogICAgICB7DQogICAgICAgICJuYW1lIjogInJpZ2h0QXJtIiwNCiAgICAgICAgInBpdm90IjogWyAtNS4wLCAyMi4wLCAwLjAgXSwNCiAgICAgICAgImN1YmVzIjogWw0KICAgICAgICAgIHsNCiAgICAgICAgICAgICJvcmlnaW4iOiBbIC04LjAsIDEyLjAsIC0yLjAgXSwNCiAgICAgICAgICAgICJzaXplIjogWyA0LCAxMiwgNCBdLA0KICAgICAgICAgICAgInV2IjogWyA0MCwgMTYgXQ0KICAgICAgICAgIH0NCiAgICAgICAgXQ0KICAgICAgfSwNCg0KICAgICAgew0KICAgICAgICAibmFtZSI6ICJsZWZ0QXJtIiwNCiAgICAgICAgInBpdm90IjogWyA1LjAsIDIyLjAsIDAuMCBdLA0KICAgICAgICAiY3ViZXMiOiBbDQogICAgICAgICAgew0KICAgICAgICAgICAgIm9yaWdpbiI6IFsgNC4wLCAxMi4wLCAtMi4wIF0sDQogICAgICAgICAgICAic2l6ZSI6IFsgNCwgMTIsIDQgXSwNCiAgICAgICAgICAgICJ1diI6IFsgNDAsIDE2IF0NCiAgICAgICAgICB9DQogICAgICAgIF0sDQogICAgICAgICJtaXJyb3IiOiB0cnVlDQogICAgICB9LA0KDQogICAgICB7DQogICAgICAgICJuYW1lIjogInJpZ2h0TGVnIiwNCiAgICAgICAgInBpdm90IjogWyAtMS45LCAxMi4wLCAwLjAgXSwNCiAgICAgICAgImN1YmVzIjogWw0KICAgICAgICAgIHsNCiAgICAgICAgICAgICJvcmlnaW4iOiBbIC0zLjksIDAuMCwgLTIuMCBdLA0KICAgICAgICAgICAgInNpemUiOiBbIDQsIDEyLCA0IF0sDQogICAgICAgICAgICAidXYiOiBbIDAsIDE2IF0NCiAgICAgICAgICB9DQogICAgICAgIF0NCiAgICAgIH0sDQoNCiAgICAgIHsNCiAgICAgICAgIm5hbWUiOiAibGVmdExlZyIsDQogICAgICAgICJwaXZvdCI6IFsgMS45LCAxMi4wLCAwLjAgXSwNCiAgICAgICAgImN1YmVzIjogWw0KICAgICAgICAgIHsNCiAgICAgICAgICAgICJvcmlnaW4iOiBbIC0wLjEsIDAuMCwgLTIuMCBdLA0KICAgICAgICAgICAgInNpemUiOiBbIDQsIDEyLCA0IF0sDQogICAgICAgICAgICAidXYiOiBbIDAsIDE2IF0NCiAgICAgICAgICB9DQogICAgICAgIF0sDQogICAgICAgICJtaXJyb3IiOiB0cnVlDQogICAgICB9DQogICAgXQ0KICB9LA0KDQogICJnZW9tZXRyeS5jYXBlIjogew0KICAgICJ0ZXh0dXJld2lkdGgiOiA2NCwNCiAgICAidGV4dHVyZWhlaWdodCI6IDMyLA0KDQogICAgImJvbmVzIjogWw0KICAgICAgew0KICAgICAgICAibmFtZSI6ICJjYXBlIiwNCiAgICAgICAgInBpdm90IjogWyAwLjAsIDI0LjAsIC0zLjAgXSwNCiAgICAgICAgImN1YmVzIjogWw0KICAgICAgICAgIHsNCiAgICAgICAgICAgICJvcmlnaW4iOiBbIC01LjAsIDguMCwgLTMuMCBdLA0KICAgICAgICAgICAgInNpemUiOiBbIDEwLCAxNiwgMSBdLA0KICAgICAgICAgICAgInV2IjogWyAwLCAwIF0NCiAgICAgICAgICB9DQogICAgICAgIF0sDQogICAgICAgICJtYXRlcmlhbCI6ICJhbHBoYSINCiAgICAgIH0NCiAgICBdDQogIH0sDQogICJnZW9tZXRyeS5odW1hbm9pZC5jdXN0b206Z2VvbWV0cnkuaHVtYW5vaWQiOiB7DQogICAgImJvbmVzIjogWw0KICAgICAgew0KICAgICAgICAibmFtZSI6ICJoYXQiLA0KICAgICAgICAibmV2ZXJSZW5kZXIiOiBmYWxzZSwNCiAgICAgICAgIm1hdGVyaWFsIjogImFscGhhIiwNCiAgICAgICAgInBpdm90IjogWyAwLjAsIDI0LjAsIDAuMCBdDQogICAgICB9LA0KICAgICAgew0KICAgICAgICAibmFtZSI6ICJsZWZ0QXJtIiwNCiAgICAgICAgInJlc2V0IjogdHJ1ZSwNCiAgICAgICAgIm1pcnJvciI6IGZhbHNlLA0KICAgICAgICAicGl2b3QiOiBbIDUuMCwgMjIuMCwgMC4wIF0sDQogICAgICAgICJjdWJlcyI6IFsNCiAgICAgICAgICB7DQogICAgICAgICAgICAib3JpZ2luIjogWyA0LjAsIDEyLjAsIC0yLjAgXSwNCiAgICAgICAgICAgICJzaXplIjogWyA0LCAxMiwgNCBdLA0KICAgICAgICAgICAgInV2IjogWyAzMiwgNDggXQ0KICAgICAgICAgIH0NCiAgICAgICAgXQ0KICAgICAgfSwNCg0KICAgICAgew0KICAgICAgICAibmFtZSI6ICJyaWdodEFybSIsDQogICAgICAgICJyZXNldCI6IHRydWUsDQogICAgICAgICJwaXZvdCI6IFsgLTUuMCwgMjIuMCwgMC4wIF0sDQogICAgICAgICJjdWJlcyI6IFsNCiAgICAgICAgICB7DQogICAgICAgICAgICAib3JpZ2luIjogWyAtOC4wLCAxMi4wLCAtMi4wIF0sDQogICAgICAgICAgICAic2l6ZSI6IFsgNCwgMTIsIDQgXSwNCiAgICAgICAgICAgICJ1diI6IFsgNDAsIDE2IF0NCiAgICAgICAgICB9DQogICAgICAgIF0NCiAgICAgIH0sDQoNCiAgICAgIHsNCiAgICAgICAgIm5hbWUiOiAicmlnaHRJdGVtIiwNCiAgICAgICAgInBpdm90IjogWyAtNiwgMTUsIDEgXSwNCiAgICAgICAgIm5ldmVyUmVuZGVyIjogdHJ1ZSwNCiAgICAgICAgInBhcmVudCI6ICJyaWdodEFybSINCiAgICAgIH0sDQoNCiAgICAgIHsNCiAgICAgICAgIm5hbWUiOiAibGVmdFNsZWV2ZSIsDQogICAgICAgICJwaXZvdCI6IFsgNS4wLCAyMi4wLCAwLjAgXSwNCiAgICAgICAgImN1YmVzIjogWw0KICAgICAgICAgIHsNCiAgICAgICAgICAgICJvcmlnaW4iOiBbIDQuMCwgMTIuMCwgLTIuMCBdLA0KICAgICAgICAgICAgInNpemUiOiBbIDQsIDEyLCA0IF0sDQogICAgICAgICAgICAidXYiOiBbIDQ4LCA0OCBdLA0KICAgICAgICAgICAgImluZmxhdGUiOiAwLjI1DQogICAgICAgICAgfQ0KICAgICAgICBdLA0KICAgICAgICAibWF0ZXJpYWwiOiAiYWxwaGEiDQogICAgICB9LA0KDQogICAgICB7DQogICAgICAgICJuYW1lIjogInJpZ2h0U2xlZXZlIiwNCiAgICAgICAgInBpdm90IjogWyAtNS4wLCAyMi4wLCAwLjAgXSwNCiAgICAgICAgImN1YmVzIjogWw0KICAgICAgICAgIHsNCiAgICAgICAgICAgICJvcmlnaW4iOiBbIC04LjAsIDEyLjAsIC0yLjAgXSwNCiAgICAgICAgICAgICJzaXplIjogWyA0LCAxMiwgNCBdLA0KICAgICAgICAgICAgInV2IjogWyA0MCwgMzIgXSwNCiAgICAgICAgICAgICJpbmZsYXRlIjogMC4yNQ0KICAgICAgICAgIH0NCiAgICAgICAgXSwNCiAgICAgICAgIm1hdGVyaWFsIjogImFscGhhIg0KICAgICAgfSwNCg0KICAgICAgew0KICAgICAgICAibmFtZSI6ICJsZWZ0TGVnIiwNCiAgICAgICAgInJlc2V0IjogdHJ1ZSwNCiAgICAgICAgIm1pcnJvciI6IGZhbHNlLA0KICAgICAgICAicGl2b3QiOiBbIDEuOSwgMTIuMCwgMC4wIF0sDQogICAgICAgICJjdWJlcyI6IFsNCiAgICAgICAgICB7DQogICAgICAgICAgICAib3JpZ2luIjogWyAtMC4xLCAwLjAsIC0yLjAgXSwNCiAgICAgICAgICAgICJzaXplIjogWyA0LCAxMiwgNCBdLA0KICAgICAgICAgICAgInV2IjogWyAxNiwgNDggXQ0KICAgICAgICAgIH0NCiAgICAgICAgXQ0KICAgICAgfSwNCg0KICAgICAgew0KICAgICAgICAibmFtZSI6ICJsZWZ0UGFudHMiLA0KICAgICAgICAicGl2b3QiOiBbIDEuOSwgMTIuMCwgMC4wIF0sDQogICAgICAgICJjdWJlcyI6IFsNCiAgICAgICAgICB7DQogICAgICAgICAgICAib3JpZ2luIjogWyAtMC4xLCAwLjAsIC0yLjAgXSwNCiAgICAgICAgICAgICJzaXplIjogWyA0LCAxMiwgNCBdLA0KICAgICAgICAgICAgInV2IjogWyAwLCA0OCBdLA0KICAgICAgICAgICAgImluZmxhdGUiOiAwLjI1DQogICAgICAgICAgfQ0KICAgICAgICBdLA0KICAgICAgICAicG9zIjogWyAxLjksIDEyLCAwIF0sDQogICAgICAgICJtYXRlcmlhbCI6ICJhbHBoYSINCiAgICAgIH0sDQoNCiAgICAgIHsNCiAgICAgICAgIm5hbWUiOiAicmlnaHRQYW50cyIsDQogICAgICAgICJwaXZvdCI6IFsgLTEuOSwgMTIuMCwgMC4wIF0sDQogICAgICAgICJjdWJlcyI6IFsNCiAgICAgICAgICB7DQogICAgICAgICAgICAib3JpZ2luIjogWyAtMy45LCAwLjAsIC0yLjAgXSwNCiAgICAgICAgICAgICJzaXplIjogWyA0LCAxMiwgNCBdLA0KICAgICAgICAgICAgInV2IjogWyAwLCAzMiBdLA0KICAgICAgICAgICAgImluZmxhdGUiOiAwLjI1DQogICAgICAgICAgfQ0KICAgICAgICBdLA0KICAgICAgICAicG9zIjogWyAtMS45LCAxMiwgMCBdLA0KICAgICAgICAibWF0ZXJpYWwiOiAiYWxwaGEiDQogICAgICB9LA0KDQogICAgICB7DQogICAgICAgICJuYW1lIjogImphY2tldCIsDQogICAgICAgICJwaXZvdCI6IFsgMC4wLCAyNC4wLCAwLjAgXSwNCiAgICAgICAgImN1YmVzIjogWw0KICAgICAgICAgIHsNCiAgICAgICAgICAgICJvcmlnaW4iOiBbIC00LjAsIDEyLjAsIC0yLjAgXSwNCiAgICAgICAgICAgICJzaXplIjogWyA4LCAxMiwgNCBdLA0KICAgICAgICAgICAgInV2IjogWyAxNiwgMzIgXSwNCiAgICAgICAgICAgICJpbmZsYXRlIjogMC4yNQ0KICAgICAgICAgIH0NCiAgICAgICAgXSwNCiAgICAgICAgIm1hdGVyaWFsIjogImFscGhhIg0KICAgICAgfQ0KICAgIF0NCiAgfSwNCiAgImdlb21ldHJ5Lmh1bWFub2lkLmN1c3RvbVNsaW06Z2VvbWV0cnkuaHVtYW5vaWQiOiB7DQoNCiAgICAiYm9uZXMiOiBbDQogICAgICB7DQogICAgICAgICJuYW1lIjogImhhdCIsDQogICAgICAgICJuZXZlclJlbmRlciI6IGZhbHNlLA0KICAgICAgICAibWF0ZXJpYWwiOiAiYWxwaGEiDQogICAgICB9LA0KICAgICAgew0KICAgICAgICAibmFtZSI6ICJsZWZ0QXJtIiwNCiAgICAgICAgInJlc2V0IjogdHJ1ZSwNCiAgICAgICAgIm1pcnJvciI6IGZhbHNlLA0KICAgICAgICAicGl2b3QiOiBbIDUuMCwgMjEuNSwgMC4wIF0sDQogICAgICAgICJjdWJlcyI6IFsNCiAgICAgICAgICB7DQogICAgICAgICAgICAib3JpZ2luIjogWyA0LjAsIDExLjUsIC0yLjAgXSwNCiAgICAgICAgICAgICJzaXplIjogWyAzLCAxMiwgNCBdLA0KICAgICAgICAgICAgInV2IjogWyAzMiwgNDggXQ0KICAgICAgICAgIH0NCiAgICAgICAgXQ0KICAgICAgfSwNCg0KICAgICAgew0KICAgICAgICAibmFtZSI6ICJyaWdodEFybSIsDQogICAgICAgICJyZXNldCI6IHRydWUsDQogICAgICAgICJwaXZvdCI6IFsgLTUuMCwgMjEuNSwgMC4wIF0sDQogICAgICAgICJjdWJlcyI6IFsNCiAgICAgICAgICB7DQogICAgICAgICAgICAib3JpZ2luIjogWyAtNy4wLCAxMS41LCAtMi4wIF0sDQogICAgICAgICAgICAic2l6ZSI6IFsgMywgMTIsIDQgXSwNCiAgICAgICAgICAgICJ1diI6IFsgNDAsIDE2IF0NCiAgICAgICAgICB9DQogICAgICAgIF0NCiAgICAgIH0sDQoNCiAgICAgIHsNCiAgICAgICAgInBpdm90IjogWyAtNiwgMTQuNSwgMSBdLA0KICAgICAgICAibmV2ZXJSZW5kZXIiOiB0cnVlLA0KICAgICAgICAibmFtZSI6ICJyaWdodEl0ZW0iLA0KICAgICAgICAicGFyZW50IjogInJpZ2h0QXJtIg0KICAgICAgfSwNCg0KICAgICAgew0KICAgICAgICAibmFtZSI6ICJsZWZ0U2xlZXZlIiwNCiAgICAgICAgInBpdm90IjogWyA1LjAsIDIxLjUsIDAuMCBdLA0KICAgICAgICAiY3ViZXMiOiBbDQogICAgICAgICAgew0KICAgICAgICAgICAgIm9yaWdpbiI6IFsgNC4wLCAxMS41LCAtMi4wIF0sDQogICAgICAgICAgICAic2l6ZSI6IFsgMywgMTIsIDQgXSwNCiAgICAgICAgICAgICJ1diI6IFsgNDgsIDQ4IF0sDQogICAgICAgICAgICAiaW5mbGF0ZSI6IDAuMjUNCiAgICAgICAgICB9DQogICAgICAgIF0sDQogICAgICAgICJtYXRlcmlhbCI6ICJhbHBoYSINCiAgICAgIH0sDQoNCiAgICAgIHsNCiAgICAgICAgIm5hbWUiOiAicmlnaHRTbGVldmUiLA0KICAgICAgICAicGl2b3QiOiBbIC01LjAsIDIxLjUsIDAuMCBdLA0KICAgICAgICAiY3ViZXMiOiBbDQogICAgICAgICAgew0KICAgICAgICAgICAgIm9yaWdpbiI6IFsgLTcuMCwgMTEuNSwgLTIuMCBdLA0KICAgICAgICAgICAgInNpemUiOiBbIDMsIDEyLCA0IF0sDQogICAgICAgICAgICAidXYiOiBbIDQwLCAzMiBdLA0KICAgICAgICAgICAgImluZmxhdGUiOiAwLjI1DQogICAgICAgICAgfQ0KICAgICAgICBdLA0KICAgICAgICAibWF0ZXJpYWwiOiAiYWxwaGEiDQogICAgICB9LA0KDQogICAgICB7DQogICAgICAgICJuYW1lIjogImxlZnRMZWciLA0KICAgICAgICAicmVzZXQiOiB0cnVlLA0KICAgICAgICAibWlycm9yIjogZmFsc2UsDQogICAgICAgICJwaXZvdCI6IFsgMS45LCAxMi4wLCAwLjAgXSwNCiAgICAgICAgImN1YmVzIjogWw0KICAgICAgICAgIHsNCiAgICAgICAgICAgICJvcmlnaW4iOiBbIC0wLjEsIDAuMCwgLTIuMCBdLA0KICAgICAgICAgICAgInNpemUiOiBbIDQsIDEyLCA0IF0sDQogICAgICAgICAgICAidXYiOiBbIDE2LCA0OCBdDQogICAgICAgICAgfQ0KICAgICAgICBdDQogICAgICB9LA0KDQogICAgICB7DQogICAgICAgICJuYW1lIjogImxlZnRQYW50cyIsDQogICAgICAgICJwaXZvdCI6IFsgMS45LCAxMi4wLCAwLjAgXSwNCiAgICAgICAgImN1YmVzIjogWw0KICAgICAgICAgIHsNCiAgICAgICAgICAgICJvcmlnaW4iOiBbIC0wLjEsIDAuMCwgLTIuMCBdLA0KICAgICAgICAgICAgInNpemUiOiBbIDQsIDEyLCA0IF0sDQogICAgICAgICAgICAidXYiOiBbIDAsIDQ4IF0sDQogICAgICAgICAgICAiaW5mbGF0ZSI6IDAuMjUNCiAgICAgICAgICB9DQogICAgICAgIF0sDQogICAgICAgICJtYXRlcmlhbCI6ICJhbHBoYSINCiAgICAgIH0sDQoNCiAgICAgIHsNCiAgICAgICAgIm5hbWUiOiAicmlnaHRQYW50cyIsDQogICAgICAgICJwaXZvdCI6IFsgLTEuOSwgMTIuMCwgMC4wIF0sDQogICAgICAgICJjdWJlcyI6IFsNCiAgICAgICAgICB7DQogICAgICAgICAgICAib3JpZ2luIjogWyAtMy45LCAwLjAsIC0yLjAgXSwNCiAgICAgICAgICAgICJzaXplIjogWyA0LCAxMiwgNCBdLA0KICAgICAgICAgICAgInV2IjogWyAwLCAzMiBdLA0KICAgICAgICAgICAgImluZmxhdGUiOiAwLjI1DQogICAgICAgICAgfQ0KICAgICAgICBdLA0KICAgICAgICAibWF0ZXJpYWwiOiAiYWxwaGEiDQogICAgICB9LA0KDQogICAgICB7DQogICAgICAgICJuYW1lIjogImphY2tldCIsDQogICAgICAgICJwaXZvdCI6IFsgMC4wLCAyNC4wLCAwLjAgXSwNCiAgICAgICAgImN1YmVzIjogWw0KICAgICAgICAgIHsNCiAgICAgICAgICAgICJvcmlnaW4iOiBbIC00LjAsIDEyLjAsIC0yLjAgXSwNCiAgICAgICAgICAgICJzaXplIjogWyA4LCAxMiwgNCBdLA0KICAgICAgICAgICAgInV2IjogWyAxNiwgMzIgXSwNCiAgICAgICAgICAgICJpbmZsYXRlIjogMC4yNQ0KICAgICAgICAgIH0NCiAgICAgICAgXSwNCiAgICAgICAgIm1hdGVyaWFsIjogImFscGhhIg0KICAgICAgfQ0KICAgIF0NCiAgfQ0KDQp9DQo=",' +
            '"SkinGeometryName":"geometry.humanoid.custom",' +
            '"SkinId":"c18e65aa-7b21-4637-9b63-8ad63622ef01_Steve",' +
            `"ThirdPartyName":"${credentials.displayName}",` +
            '"UIProfile":0' +
            '}'
        ) + '.verify';

        const packet = PacketPool.getPacket();
        packet.packUnsignedVarInt(ProtocolId.Login);

        packet.packInt(390);            // protocol

        packet.packUnsignedVarInt(chainData.length + skinData.length + 8);      // 2 lengths + 2 LEInt
        packet.packLIntString(chainData);
        packet.packLIntString(skinData);

        console.log('send login' + credentials)

        this.sendPacket(packet);
    }

    public sendResourcePackClientResponse(status: byte, ids?: string[]): void {

        /**
         * Status code constants
         * 1        REFUSED
         * 2        SEND_PACKS
         * 3        HAVE_ALL_PACKS
         * 4        COMPLETED
         */

        const packet = PacketPool.getPacket();
        packet.packUnsignedVarInt(ProtocolId.ResourcePackClientResponse);
        packet.packByte(status);
        if (ids == undefined) {
            packet.packShort(0);
        } else {
            packet.packShort(ids.length);
            ids.forEach(id => packet.packString(id));
        }
        this.sendPacket(packet);
    }

    public sendText(type: byte, primaryName: string, message: string) {

        const packet = PacketPool.getPacket();
        packet.packUnsignedVarInt(ProtocolId.Text);
        packet.packByte(1);     // type = CHAT
        packet.packBoolean(false);      // isLocalized
        packet.packString(primaryName);
        packet.packString(message);
        packet.packString("");      // sendersXUID
        packet.packString("");      // platformIdString

        this.sendPacket(packet);
    }

    public sendMovePlayer(loc: PlayerLocation, mode: byte = 0, onGround: boolean = true) {

        /**
         * Mode constants
         * 0        Normal
         * 1        Reset
         * 2        Teleport
         * 3        Rotation
         */

        const packet = PacketPool.getPacket();
        packet.packUnsignedVarInt(ProtocolId.MovePlayer);
        packet.packUnsignedVarLong(this.client.playerInfo.runtimeEntityId);
        packet.packLFloat(loc.x);
        packet.packLFloat(loc.y);
        packet.packLFloat(loc.z);
        packet.packLFloat(loc.pitch);
        packet.packLFloat(loc.yaw);
        packet.packLFloat(loc.headYaw);
        packet.packByte(mode);
        packet.packBoolean(onGround);
        packet.packUnsignedVarLong(new Long(0));      // otherRuntimeEntityId

        this.sendPacket(packet);
    }


    public sendRequestChunkRadius(radius: int): void {

        const packet = PacketPool.getPacket();
        packet.packUnsignedVarInt(ProtocolId.RequestChunkRadius);
        packet.packVarInt(radius);

        this.sendPacket(packet);
    }


    /**
     * Helper function
     */
    protected sendPacket(pk: BinaryWriter): void {

        this.client.sendPacket(pk.getBuffer())

        return;

        this._batchPool.pushPacket(pk);

        // todo: when necessary, move this to an update function so we can actually batch packets
        this._batchPool.processBatch();
    }

}
