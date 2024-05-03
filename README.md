# Vega transaction checker

A simple tool to check Vega transacton JSON.

## Features

- Validates JSON is well formed and parses, attempts to show the error in context if not.

- Encodes the JSON using https://www.npmjs.com/package/@vegaprotocol/protos and shows any errors.

- Re-serialises the encoded data as JSON and shows a diff between this and the original input, which often highlights missing or unexpected fields in the input.

- Encodes the input data in the URL hash for ease of sharing.

- Autocompletes and provides documentation tooltips for most commands.
  
- Diffs market updates against latest enacted proposal to allow analysis of the impact of a market change proposal prior to submission.
  

## Known limitations

- Serialising the encoded data to JSON doesn't always produce the format expected by the wallet etc. This now only occurs in a few cases like arguments for EVM contracts in oracle specs, and base64 encoded fields.

- Validation errors found by the protobuf encoder don't provider a location/field name and therefore lack much in the way of useful context.

- The URLs with encoded data in the hash are very long. Often too long to share on Slack or even use with URL shorteners. 


## Potential future enhancements

- Fix JSON encoding (hopefully via upstream library enhancement).

- Alternative and less unwieldy content-addressable sharing system.

- Call tx check endpoint on data node to provide more detailed and helpful validation.

- Ability to submit transactons.

- Support for linter style rules to provide additional help.

- Form-powered templates to speed up and simplify creation of transactions.

- Ability to download and copy data from a data node when making modification transactions.

