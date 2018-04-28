/**
 * The loading order must be dirty-chai -> sinon-chai
 * @see {@link https://github.com/prodatakey/dirty-chai#plugin-assertions}
 * @see {@link https://github.com/prodatakey/dirty-chai#caveats}
 */
const { use } = require('chai');

const dirtyChai = require('dirty-chai');

use(dirtyChai);

const sinonChai = require('sinon-chai');

use(sinonChai);
