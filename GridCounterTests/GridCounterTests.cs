namespace GridCounterTests
{
    [TestClass]
    public sealed class GridCounterTests
    {
        [TestMethod]
        [DataRow(1, 1)]
        [DataRow(2, 5)]
        [DataRow(3, 14)]
        public void TestCount(int gridSize, int expectedCount)
        {
            var actualCount = new GridCounter.Counter().Count(gridSize);

            Assert.AreEqual(expectedCount, actualCount);
        }
    }
}
