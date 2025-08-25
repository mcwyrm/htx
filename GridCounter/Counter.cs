using System.Diagnostics;

namespace GridCounter
{
    public class Counter
    {
        public int Count(int gridSize)
        {
            Debug.Assert(gridSize > 0);
            int count = 0;
            for (int countSize = 1; countSize <= gridSize; countSize++)
            {
                count += countSize * countSize;
            }
            return count;
        }
    }
}

