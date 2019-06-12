// @flow
type TitleType = {
    title: 'Mr' | 'Ms' | 'Dr',
};

class TestClass {
    static TestClassFunc(title: TitleType = {title: 'Mr'}) {}
}
