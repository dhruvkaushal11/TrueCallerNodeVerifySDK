    'use strict';

    const CONFIG = require('./config.js');
    const ALGO_MAP = {
      'SHA512withRSA': 'RSA-SHA512'
    };

    var request = require('request');
    var _ = require('underscore');
    var async = require('async');
    var pemtools = require('pemtools');
    const crypto = require('crypto');

    function _fetchPublicKey(callback) {
      var options = {
        url: CONFIG.PUBLIC_KEY_URL,
        method: 'GET',
        json: true
      };

      request(options, function (err, response, body) {
        if (err) {
          return callback(err);
        }

        if (!body || body.length === 0 || !body[0].key, !body[0].keyType) {
          return callback('Failed to read public key from key server.');
        }

        return callback(null, body[0]);
      });
    }

    function _getDecodedPayloadFromProfile(profile, callback) {
      if (!profile.payload) {
        return callback('Error: Profile does not contain payload');
      }

      try {
        var payload = JSON.parse(new Buffer(profile.payload, 'base64').toString());
        return callback(null, payload);
      } catch (e) {
        return callback(e);
      }
    };

    function _deconstructProfile(profile, callback) {
      try {
        var result = {};

        var _profile = JSON.parse(JSON.stringify(profile));

        delete(_profile.signature);
        delete(_profile.signatureAlgorithm);
        delete(_profile.payload);
        delete(_profile.isSimChanged);
        delete(_profile.verificationTimestamp);
        delete(_profile.verificationMode);

        result.profile = _profile;
        result.signature = profile.signature;
        result.signatureAlgorithm = profile.signatureAlgorithm;
        result.payload = profile.payload;

        _getDecodedPayloadFromProfile(profile, function (err, decodedPayload) {
          if (err) {
            return callback(err);
          }

          result.decodedPayload = decodedPayload;

          return callback(null, result);
        });
      } catch (e) {
        return callback(e);
      }
    };

    function _verifyPayload(profile, callback) {
      _deconstructProfile(profile, function (err, truecallerProfile) {
        if (err) {
          return callback(err);
        }

        if (truecallerProfile.decodedPayload.hasOwnProperty('requestTime')) {
          delete truecallerProfile.decodedPayload.requestTime;
        }
          if (truecallerProfile.profile.hasOwnProperty('userLocale')) {
          delete truecallerProfile.profile.userLocale;
        }

        if (_.isEqual(truecallerProfile.profile, truecallerProfile.decodedPayload)) {
          console.log("NOT EQUAL: %j" , truecallerProfile.profile)
          console.log("NOT EQUAL: %j" , truecallerProfile.decodedPayload)
          return callback(null, true);
        } else {
          console.log("NOT EQUAL: %j" , truecallerProfile.profile)
          console.log("NOT EQUAL: %j" , truecallerProfile.decodedPayload)
          return callback(null, false);
        }
      });
    };

    function _verifySignature(profile, callback) {
      async.waterfall([
        function (cb) {
          

            return cb(null, "RSA", "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDEpFwIarbm48m6ueG+jhpt2vCGaqXZlwR/HPuL4zH1DQ/eWFbgQtVnrta8QhQz3ywLnbX6s7aecxUzzNJsTtS8VxKAYll4E1lJUqrNdWt8CU+TaUQuFm8vzLoPiYKEXl4bX5rzMQUMqA228gWuYmRFQnpduQTgnYIMO8XVUQXl5wIDAQAB");
          
        },

        function (keyType, key, cb) {
          _deconstructProfile(profile, function (err, result) {
            if (err) {
              return cb(err);
            }

            return cb(null, keyType, key, result.payload, result.signature, result.signatureAlgorithm);
          });
        },

        function (keyType, key, payload, signature, signatureAlgorithm, cb) {
          var _key = Buffer.from(pemtools(Buffer.from(key, 'base64'), 'PUBLIC KEY').pem);
          var _payload = Buffer.from(payload);
          var _signature = Buffer.from(signature, 'base64');
          var _signatureAlgorithm = ALGO_MAP[signatureAlgorithm];
          var verifier = crypto.createVerify(_signatureAlgorithm);
          verifier.update(_payload);

          var signatureVerificationResult = verifier.verify(_key, _signature);


          return cb(null, signatureVerificationResult);
        }
      ], function (err, result) {
        if (err) {
          return callback(err);
        }

        return callback(null, result);
      });
    };
 

    function _verifyProfile(profile, callback) {
      async.parallel([
        function (cb) {
          _verifyPayload(profile, function (err, result) {
            if (err) {
              return cb(err);
            }

            return cb(null, result);
          });
        },

        function (cb) {
          _verifySignature(profile, function (err, result) {
            if (err) {
              return cb(err);
            }
            return cb(null, result);
          });
        }
      ], function (err, results) {
        if (err) {
          return callback(err);
        }
        console.log(results[0])
        if (results[0] === true && results[1] === true) {
          return callback(null, true);
        } else {
          return callback(null, false);
        }
      });
    };
     exports.verifyToken = function(req, res) {
         if( req.body == undefined){
            res.json({"m" : "No Body Parameters Found", "status" : false})
         } 
         else{
         _verifyProfile(req.body, function(err, callback){
          if(err){
             res.json({"m" : "Invalid request", "status" : false})
          }
          console.log(callback)
          if(callback){
            res.json({"m" : "Success", "status" : true})
          }
          else{
            res.json({"m" : "Invalid User", "status" : false})
          }
        });
       }
     }

