### Goals
  - Easily write and test effects with their corresponding data transformations over time (streams)
  - Functional effects-as-data api alternative to the current imperative option
  - Eliminate boilerplate cmd objects, extra file cruft, and transformation from generators to promises
  - Provide type safety and intellisense for both sourcecode and testing

### Testing
  - Provide a declarative, consistent, and intuitive testing api that distinguishes between but can be run as both a unit test and an integration test by either using the mocks or by running the actual side effects or a mixture of the two
  - Testing strategy should encourage thought about inputs and outputs instead of operators

#### Mocking
  - Allow partial implementations of an interface so that only the relevant parts of a mock must be provided by the user
  - Detect whether a variable is used within the function. If not, then realistic mock data isn't necessary.

### Questions
  Can we make a function that takes a function as a parameter and can derrive the input and return type information so that the `.with()` function can expect the same type and can also return a mock.

  If not, can we call our function but short circuit its execution and monkey patch the result so we can benefit from its static typing.

